import { type CollectionAfterChangeHook, type CollectionSlug } from 'payload'
import { type Dub } from 'dub'

import { type DubTags, type DubTypes } from '../types.js'
import { getLink } from '../utils/getLink.js'
import { matches } from '../utils/matches.js'

type Props = {
  domain?: string
  dub: Dub
  isPro?: boolean
  linksSlug?: CollectionSlug
  originalSlug: string
  siteUrl: string
  slug: string
  tagsSlug?: CollectionSlug
  tenantId?: string
}

export const createSingle =
  ({
    slug,
    domain,
    dub,
    isPro = false,
    linksSlug = 'dubLinks',
    originalSlug,
    siteUrl,
    tagsSlug = 'dubTags',
    tenantId,
  }: Props): CollectionAfterChangeHook =>
  async ({ collection, context, doc, operation, req }) => {
    const drafts = Boolean(collection.versions?.drafts)

    if (
      context?.skipDubHook ||
      !['create', 'update'].includes(operation) ||
      (drafts && doc._status !== 'published')
    ) {
      return doc
    }

    const { payload } = req

    try {
      const lookup = await payload.find({
        collection: linksSlug,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        where: {
          and: [
            { 'source.relationTo': { equals: originalSlug } },
            { 'source.value': { equals: doc.id } },
          ],
        },
      })

      const link =
        lookup.docs[0] ||
        (await payload.create({
          collection: tagsSlug,
          context: { ...context, skipDubHook: true },
          data: {
            source: {
              relationTo: originalSlug,
              value: doc.id,
            },
          },
          depth: 0,
          overrideAccess: true,
          req,
        }))

      const document = doc as DubTags

      const payloadTagIds = [
        ...new Set(
          Array.isArray(document.dubTags)
            ? document.dubTags
                .map((tag) => (typeof tag === 'object' && tag !== null ? tag.id : tag))
                .filter(
                  (id): id is string | number =>
                    typeof id === 'number' || (typeof id === 'string' && id.length > 0)
                )
            : []
        ),
      ]

      const tags = payloadTagIds.length
        ? await payload.find({
            collection: tagsSlug,
            depth: 0,
            limit: payloadTagIds.length,
            overrideAccess: true,
            req,
            where: { id: { in: payloadTagIds } },
          })
        : null

      const dubTagIds = [
        ...new Set(
          tags?.docs
            .map((tag) => tag.tagID)
            .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? []
        ),
      ]

      const externalId = link.externalId?.startsWith('ext_')
        ? link.externalId
        : `ext_${link.externalId || `${slug}_${link.id}`}`

      const tid = tenantId
        ? tenantId.startsWith('user_')
          ? tenantId
          : `user_${tenantId}`
        : undefined

      const url = `${siteUrl.replace(/\/$/, '')}/${slug}/${doc.slug}`

      const existing = await getLink(dub, externalId)

      let folderId: string | undefined

      if (isPro) {
        const folders = await dub.folders.list()

        const folder =
          folders.find((folder) => folder.name === slug) ||
          (await dub.folders.create({ name: slug }))

        folderId = folder.id
      }

      const currentTagIds = existing?.tags?.map((tag) => tag.id) ?? []

      const requiresUpdate =
        !existing ||
        existing.url !== url ||
        !matches(currentTagIds, dubTagIds) ||
        (domain !== undefined && existing.domain !== domain) ||
        (folderId !== undefined && existing.folderId !== folderId) ||
        (tid !== undefined && existing.tenantId !== tid)

      const data: DubTypes = {
        externalId,
        tagIds: dubTagIds,
        url,
        ...(domain ? { domain } : {}),
        ...(folderId ? { folderId } : {}),
        ...(tid ? { tenantId: tid } : {}),
      }

      const updated = existing
        ? requiresUpdate
          ? await dub.links.update(existing.id, data)
          : existing
        : await dub.links.create(data)

      const currentPayloadTagIds = Array.isArray(link.dubTags)
        ? link.dubTags.map((tag) => (typeof tag === 'object' && tag !== null ? tag.id : tag))
        : []

      const requiresSync =
        link.externalId !== externalId ||
        link.shortLink !== updated.shortLink ||
        !matches(currentPayloadTagIds, payloadTagIds)

      if (requiresSync) {
        await payload.update({
          id: link.id,
          collection: 'dubLinks',
          context: { ...context, skipDubHook: true },
          data: {
            dubTags: payloadTagIds,
            externalId,
            shortLink: updated.shortLink,
          },
          depth: 0,
          overrideAccess: true,
          req,
        })
      }
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Failed to create or update Dub shortlink',
      })
    }

    return doc
  }
