import { type Dub } from 'dub'

import { LIMIT } from '../constants.js'
import { type Analytics, type Link, type Range, type Series, type Totals } from '../types.js'
import { asRecord, asRows, number, pick, toMetrics } from '../utils.js'

const GROUPS = [
  'count',
  'timeseries',
  'countries',
  'devices',
  'referers',
  'utm_campaigns',
  'utm_sources',
  'top_links',
] as const

export async function loadAnalytics(dub: Dub, links: Link[], range: Range): Promise<Analytics> {
  const warnings: string[] = []
  const selected = links.slice(0, LIMIT)
  const linkId = selected.map((link) => link.id).join(',')

  if (links.length > LIMIT) {
    warnings.push(
      `Period analytics are limited to ${LIMIT} links. Select a link for precise totals.`
    )
  }

  const results = await Promise.allSettled(
    GROUPS.map((groupBy) =>
      dub.analytics.retrieve({
        event: groupBy === 'count' ? 'composite' : 'clicks',
        groupBy,
        interval: range,
        linkId,
        timezone: 'UTC',
      })
    )
  )

  const data = results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value as unknown

    warnings.push(`${GROUPS[index]} analytics could not be retrieved from Dub.`)

    return null
  })

  const count = data[0] ? asRecord(data[0]) : null

  const totals: Totals | null = count
    ? {
        clicks: number(count.clicks),
        leads: number(count.leads),
        sales: number(count.sales),
        saleAmount: number(count.saleAmount),
      }
    : null

  const series: Series[] = asRows(data[1]).map((row) => ({
    label: pick(row, 'start', 'date', 'timestamp'),
    clicks: number(row.clicks),
  }))

  const topLinks = asRows(data[7]).map((row) => ({
    name:
      pick(asRecord(row.link), 'shortLink', 'url', 'key') !== 'Unknown'
        ? pick(asRecord(row.link), 'shortLink', 'url', 'key')
        : pick(row, 'shortLink', 'url', 'linkId'),
    clicks: number(row.clicks),
    leads: number(row.leads),
    sales: number(row.sales),
    saleAmount: number(row.saleAmount),
  }))

  return {
    totals,
    series,
    countries: toMetrics(data[2], 'country'),
    devices: toMetrics(data[3], 'device'),
    referers: toMetrics(data[4], 'referer'),
    campaigns: toMetrics(data[5], 'utm_campaign', 'utmCampaign'),
    sources: toMetrics(data[6], 'utm_source', 'utmSource'),
    topLinks,
    warnings,
  }
}
