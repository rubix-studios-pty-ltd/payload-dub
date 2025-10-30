import { type CollectionConfig, type CollectionSlug, type Field } from 'payload'

export interface DubTypes {
  /** Android destination URL for device targeting. */
  android?: null | string

  /** Whether the short link is archived. Defaults to false. */
  archived?: boolean

  /** Optional comments for the short link. */
  comments?: null | string

  /** Custom link preview description (og:description). Used when `proxy` is true. */
  description?: null | string

  /** Allow search engines to index this link. Defaults to false. */
  doIndex?: boolean

  /** The domain of the short link. Defaults to primary workspace domain or dub.sh */
  domain?: string

  /** The URL to redirect to after expiration. */
  expiredUrl?: null | string

  /** Expiry date/time of the short link. */
  expiresAt?: null | string

  /** The external ID in your database (unique across workspace, prefixed with 'ext_'). */
  externalId?: null | string

  /** The folder ID to assign the short link to. */
  folderId?: null | string

  /** Geographic targeting rules (country/state/city). */
  geo?: null | Record<string, string>

  /** A unique identifier across the workspace, used for client-side tracking. */
  identifier?: null | string

  /** Custom link preview image (og:image). Used when `proxy` is true. */
  image?: null | string

  /** iOS destination URL for device targeting. */
  ios?: null | string

  /** The short link slug. If not provided, a random 7-character slug will be generated. */
  key?: string

  /** The length of the short link slug. Defaults to 7 if not provided. */
  keyLength?: number

  /** The partner ID associated with the short link. */
  partnerId?: null | string

  /** Optional password required to access destination URL. */
  password?: null | string

  /** Prefix for random slug generation (e.g., "/c/"). Ignored if `key` is provided. */
  prefix?: string

  /** The program ID associated with the short link. */
  programId?: null | string

  /** Whether the short link uses Custom Link Previews (proxy). Defaults to false. */
  proxy?: boolean

  /** Deprecated: use `dashboard` instead. Whether stats are publicly accessible. */
  publicStats?: boolean

  /** Referral tag for the short link. */
  ref?: null | string

  /** Whether the short link uses link cloaking (rewrite). Defaults to false. */
  rewrite?: boolean

  /** Unique IDs of tags assigned to this link. */
  tagIds?: string | string[]

  /** Unique names of tags assigned to this link (case insensitive). */
  tagNames?: string | string[]

  /** The tenant ID that created the link in your system. */
  tenantId?: null | string

  /** Date/time when the test completed (or will complete). */
  testCompletedAt?: null | string

  /** Date/time when the test started. */
  testStartedAt?: null | string

  /** A/B test variants with percentage distribution. */
  testVariants?: Array<{
    percentage: number
    url: string
  }>

  /** Custom link preview title (og:title). Used when `proxy` is true. */
  title?: null | string
  /** Whether to track conversions for this link. Defaults to false. */
  trackConversion?: boolean
  /** The destination URL of the short link. */
  url: string
  utm_campaign?: null | string
  utm_content?: null | string

  utm_medium?: null | string

  /** UTM parameters (optional overrides for destination URL). */
  utm_source?: null | string

  utm_term?: null | string

  /** Custom link preview video (og:video). Used when `proxy` is true. */
  video?: null | string

  /** Array of webhook IDs triggered upon link click. */
  webhookIds?: null | string[]
}

export type DubCollection =
  | {
      docs: CollectionSlug
      slugOverride?: string
    }
  | CollectionSlug

export type DubConfig = {
  collections?: DubCollection[]
  disabled?: boolean
  domain?: string
  dubApiKey: string
  isPro?: boolean
  overrides?: {
    dubCollection?: {
      access?: CollectionConfig['access']
      admin?: CollectionConfig['admin']
      fields?: (args: { defaultFields: Field[] }) => Field[]
    } & Partial<Omit<CollectionConfig, 'fields'>>
    dubTagCollection?: {
      access?: CollectionConfig['access']
      admin?: CollectionConfig['admin']
      fields?: (args: { defaultFields: Field[] }) => Field[]
    } & Partial<Omit<CollectionConfig, 'fields'>>
  }
  siteUrl: string
  tenantId?: string
}

export const DubColors = {
  Blue: 'blue',
  Brown: 'brown',
  Green: 'green',
  Pink: 'pink',
  Purple: 'purple',
  Red: 'red',
  Yellow: 'yellow',
} as const

export type ClosedEnum<T> = T[keyof T]

export type DubTagColor = ClosedEnum<typeof DubColors>

export type DubFolder = {
  id: string
  name: string
}

export type DubTags = {
  _status?: string
  dubTags?: ({ id: string } | string)[]
  id: string
  slug: string
}
