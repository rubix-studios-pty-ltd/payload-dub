import { type Dub } from 'dub'

import { LOOKUP_BATCH, LOOKUP_LIMIT, PAGE_LIMIT, PAGE_SIZE } from '../constants.js'
import { type Link, type LocalLink } from '../types.js'
import { emptyTotals, linkKey, number, urlKey, urlParam } from '../utils.js'

type RemoteLink = Awaited<ReturnType<Dub['links']['get']>>

function mapLink(remote: RemoteLink, local: LocalLink): Link {
  return {
    id: remote.id,
    externalId: local.externalId,
    shortLink: remote.shortLink || local.shortLink,
    url: remote.url,
    source: local.source,
    clicks: number(remote.clicks),
    leads: number(remote.leads),
    sales: number(remote.sales),
    saleAmount: number(remote.saleAmount),
    campaign: remote.utmCampaign || urlParam(remote.url, 'utm_campaign'),
    medium: remote.utmMedium || urlParam(remote.url, 'utm_medium'),
    utmSource: remote.utmSource || urlParam(remote.url, 'utm_source'),
    synced: true,
  }
}

const fallback = (local: LocalLink): Link => ({
  ...local,
  url: '',
  ...emptyTotals(),
  campaign: '',
  medium: '',
  utmSource: '',
  synced: false,
})

async function getRemote(dub: Dub, local: LocalLink): Promise<RemoteLink | null> {
  if (local.externalId.startsWith('ext_')) {
    try {
      return await dub.links.get({ externalId: local.externalId })
    } catch {
      // Fall back to the short URL.
    }
  }

  const key = linkKey(local.shortLink)

  if (!key) return null

  try {
    return await dub.links.get(key)
  } catch {
    return null
  }
}

export async function remoteLinks(dub: Dub, locals: LocalLink[], tenantId?: string) {
  const matches = new Map<string, Link>()
  const warnings: string[] = []

  const normalizedTenantId = tenantId
    ? tenantId.startsWith('user_')
      ? tenantId
      : `user_${tenantId}`
    : undefined

  let complete = true

  if (locals.length > LOOKUP_LIMIT) {
    const byExternalId = new Map(
      locals.filter((link) => link.externalId).map((link) => [link.externalId, link])
    )

    const byShortLink = new Map(
      locals.filter((link) => urlKey(link.shortLink)).map((link) => [urlKey(link.shortLink), link])
    )

    try {
      const pages = await dub.links.list({
        pageSize: PAGE_SIZE,
        showArchived: true,
        ...(normalizedTenantId ? { tenantId: normalizedTenantId } : {}),
      })

      let page = 0

      for await (const response of pages) {
        page++

        for (const remote of response.result) {
          const local =
            byExternalId.get(remote.externalId || '') || byShortLink.get(urlKey(remote.shortLink))

          if (local && remote.id) {
            matches.set(local.id, mapLink(remote, local))
          }
        }

        if (page >= PAGE_LIMIT) {
          complete = response.result.length < PAGE_SIZE
          break
        }
      }
    } catch {
      warnings.push('The Dub link listing failed. Trying direct link instead.')
    }
  }

  const remaining = locals.filter((local) => !matches.has(local.id))
  const lookup = remaining.slice(0, LOOKUP_LIMIT)

  for (let index = 0; index < lookup.length; index += LOOKUP_BATCH) {
    const results = await Promise.all(
      lookup.slice(index, index + LOOKUP_BATCH).map(async (local) => ({
        local,
        remote: await getRemote(dub, local),
      }))
    )

    for (const { local, remote } of results) {
      if (!remote?.id) continue

      if (normalizedTenantId && remote.tenantId && remote.tenantId !== normalizedTenantId) {
        continue
      }

      matches.set(local.id, mapLink(remote, local))
    }
  }

  const missing = locals.length - matches.size

  if (missing) {
    warnings.push(`${missing} managed link${missing === 1 ? '' : 's'} could not be verified.`)
  }

  if (remaining.length > LOOKUP_LIMIT) {
    warnings.push(`Individual lookups were limited to ${LOOKUP_LIMIT} unmatched links.`)
  }

  return {
    links: locals.map((local) => matches.get(local.id) || fallback(local)),
    complete,
    warnings,
  }
}
