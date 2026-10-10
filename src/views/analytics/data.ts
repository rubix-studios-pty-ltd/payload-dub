import { loadAnalytics } from './lib/analytics.js'
import { localLinks } from './lib/local.js'
import { remoteLinks } from './lib/remote.js'
import { type Report, type ReportInput, type Totals } from './types.js'
import { addTotals, emptyTotals } from './utils.js'

export async function loadReport({
  dub,
  payload,
  req,
  linksSlug,
  tenantId,
  isPro,
  range,
  externalId,
}: ReportInput): Promise<Report> {
  const local = await localLinks(payload, req, linksSlug)

  if (!local.links.length) {
    return {
      allLinks: [],
      links: [],
      totals: emptyTotals(),
      complete: local.complete,
      analytics: null,
      warnings: ['No links were found in the Payload Dub Links collection.'],
    }
  }

  const remote = await remoteLinks(dub, local.links, tenantId)
  const allLinks = remote.links.sort((a, b) => b.clicks - a.clicks)

  const links = externalId
    ? allLinks.filter((link) => (link.externalId || link.shortLink) === externalId)
    : allLinks

  const verified = links.filter((link) => link.synced)
  const totals = verified.reduce<Totals>(addTotals, emptyTotals())

  const analytics = isPro && verified.length ? await loadAnalytics(dub, verified, range) : null

  return {
    allLinks,
    links,
    totals,
    complete: local.complete && remote.complete,
    analytics,
    warnings: remote.warnings,
  }
}
