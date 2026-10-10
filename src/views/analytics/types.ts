import { type CollectionSlug, type Payload, type PayloadRequest } from 'payload'
import { type Dub } from 'dub'

export type Range = '24h' | '7d' | '30d' | '90d'

export const RANGES: { label: string; value: Range }[] = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
]

export type Totals = {
  clicks: number
  leads: number
  sales: number
  saleAmount: number
}

export type Link = Totals & {
  id: string
  externalId: string
  shortLink: string
  url: string
  source: string
  campaign: string
  medium: string
  utmSource: string
  synced: boolean
}

export type LocalLink = Pick<Link, 'id' | 'externalId' | 'shortLink' | 'source'>

export type Metric = Totals & { name: string }
export type Series = { label: string; clicks: number }

export type Analytics = {
  totals: Totals | null
  series: Series[]
  countries: Metric[]
  devices: Metric[]
  referers: Metric[]
  campaigns: Metric[]
  sources: Metric[]
  topLinks: Metric[]
  warnings: string[]
}

export type Report = {
  allLinks: Link[]
  links: Link[]
  totals: Totals
  complete: boolean
  analytics: Analytics | null
  warnings: string[]
}

export type ReportInput = {
  dub: Dub
  payload: Payload
  req: PayloadRequest
  linksSlug: CollectionSlug
  tenantId?: string
  isPro: boolean
  range: Range
  externalId?: string
}
