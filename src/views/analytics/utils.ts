import { type Link, type Metric, type Totals } from './types.js'

const numberFormatter = new Intl.NumberFormat('en-US')
const moneyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

export const number = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

export const formatNumber = (value: number): string => numberFormatter.format(value)

export const formatMoney = (cents: number): string => moneyFormatter.format(cents / 100)

export const formatRate = (numerator: number, denominator: number): string =>
  denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : '0%'

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

export const asRows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : []

export const pick = (row: Record<string, unknown>, ...names: string[]): string => {
  for (const name of names) {
    const value = row[name]

    if (typeof value === 'string' && value) return value
  }

  return 'Unknown'
}

export const toMetrics = (value: unknown, ...names: string[]): Metric[] =>
  asRows(value).map((row) => ({
    name: pick(row, ...names),
    clicks: number(row.clicks),
    leads: number(row.leads),
    sales: number(row.sales),
    saleAmount: number(row.saleAmount),
  }))

export const urlParam = (value: string, name: string): string => {
  try {
    return new URL(value).searchParams.get(name) || ''
  } catch {
    return ''
  }
}

export const linkKey = (value: string): { domain: string; key: string } | null => {
  try {
    const url = new URL(value)

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))

    return key ? { domain: url.hostname, key } : null
  } catch {
    return null
  }
}

export const urlKey = (value: string): string => {
  const info = linkKey(value)

  return info ? `${info.domain}/${info.key}` : ''
}

export const safeHref = (value: string): string | undefined => {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export const emptyTotals = (): Totals => ({
  clicks: 0,
  leads: 0,
  sales: 0,
  saleAmount: 0,
})

export const addTotals = (total: Totals, item: Totals): Totals => ({
  clicks: total.clicks + item.clicks,
  leads: total.leads + item.leads,
  sales: total.sales + item.sales,
  saleAmount: total.saleAmount + item.saleAmount,
})

export const groupLinks = (links: Link[], key: 'campaign' | 'medium' | 'utmSource'): Metric[] => {
  const values = new Map<string, Totals>()

  for (const link of links) {
    if (!link.synced || !link[key]) continue

    values.set(link[key], addTotals(values.get(link[key]) || emptyTotals(), link))
  }

  return [...values]
    .map(([name, totals]) => ({ name, ...totals }))
    .sort((a, b) => b.clicks - a.clicks)
}

export const attribution = (links: Link[]) => ({
  campaigns: groupLinks(links, 'campaign'),
  sources: groupLinks(links, 'utmSource'),
  mediums: groupLinks(links, 'medium'),
})
