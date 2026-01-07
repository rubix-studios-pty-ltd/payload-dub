import { type CollectionConfig, type CollectionSlug, type Field } from 'payload'

/**
 * The access level of the folder within the workspace.
 */
export const AccessLevel = {
  Read: 'read',
  Write: 'write',
} as const

/**
 * The access level of the folder within the workspace.
 */
export type AccessLevel = ClosedEnum<typeof AccessLevel>

export interface DubTypes {
  /**
   * The Android destination URL for the short link for Android device targeting.
   */
  android?: null | string | undefined
  /**
   * Whether the short link is archived. Defaults to `false` if not provided.
   */
  archived?: boolean | undefined
  /**
   * The comments for the short link.
   */
  comments?: null | string | undefined
  /**
   * The custom link preview description (og:description). Will be used for Custom Link Previews if `proxy` is true. Learn more: https://d.to/og
   */
  description?: null | string | undefined
  /**
   * Allow search engines to index your short link. Defaults to `false` if not provided. Learn more: https://d.to/noindex
   */
  doIndex?: boolean | undefined
  /**
   * The domain of the short link (without protocol). If not provided, the primary domain for the workspace will be used (or `dub.sh` if the workspace has no domains).
   */
  domain?: string | undefined
  /**
   * The URL to redirect to when the short link has expired.
   */
  expiredUrl?: null | string | undefined
  /**
   * The date and time when the short link will expire at.
   */
  expiresAt?: null | string | undefined
  /**
   * The ID of the link in your database. If set, it can be used to identify the link in future API requests (must be prefixed with 'ext_' when passed as a query parameter). This key is unique across your workspace.
   */
  externalId?: null | string | undefined
  /**
   * The unique ID existing folder to assign the short link to.
   */
  folderId?: null | string | undefined
  /**
   * Geo targeting information for the short link in JSON format `{[COUNTRY]: https://example.com }`. See https://d.to/geo for more information.
   */
  geo?: { [k: string]: string } | null | undefined
  /**
   * The custom link preview image (og:image). Will be used for Custom Link Previews if `proxy` is true. Learn more: https://d.to/og
   */
  image?: null | string | undefined
  /**
   * The iOS destination URL for the short link for iOS device targeting.
   */
  ios?: null | string | undefined
  /**
   * The short link slug. If not provided, a random 7-character slug will be generated.
   */
  key?: string | undefined
  /**
   * The length of the short link slug. Defaults to 7 if not provided. When used with `prefix`, the total length of the key will be `prefix.length + keyLength`.
   */
  keyLength?: number | undefined
  /**
   * The ID of the partner the short link is associated with.
   */
  partnerId?: null | string | undefined
  /**
   * The password required to access the destination URL of the short link.
   */
  password?: null | string | undefined
  /**
   * The prefix of the short link slug for randomly-generated keys (e.g. if prefix is `/c/`, generated keys will be in the `/c/:key` format). Will be ignored if `key` is provided.
   */
  prefix?: string | undefined
  /**
   * The ID of the program the short link is associated with.
   */
  programId?: null | string | undefined
  /**
   * Whether the short link uses Custom Link Previews feature. Defaults to `false` if not provided.
   */
  proxy?: boolean | undefined
  /**
   * Deprecated: Use `dashboard` instead. Whether the short link's stats are publicly accessible. Defaults to `false` if not provided.
   *
   * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
   */
  publicStats?: boolean | undefined
  /**
   * The referral tag of the short link. If set, this will populate or override the `ref` query parameter in the destination URL.
   */
  ref?: null | string | undefined
  /**
   * Whether the short link uses link cloaking. Defaults to `false` if not provided.
   */
  rewrite?: boolean | undefined
  /**
   * Deprecated: Use `tagIds` instead. The unique ID of the tag assigned to the short link.
   *
   * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
   */
  tagId?: null | string | undefined
  /**
   * The unique IDs of the tags assigned to the short link.
   */
  tagIds?: Array<string> | string | undefined
  /**
   * The unique name of the tags assigned to the short link (case insensitive).
   */
  tagNames?: Array<string> | string | undefined
  /**
   * The ID of the tenant that created the link inside your system. If set, it can be used to fetch all links for a tenant.
   */
  tenantId?: null | string | undefined
  /**
   * The date and time when the tests were or will be completed.
   */
  testCompletedAt?: null | string | undefined
  /**
   * The date and time when the tests started.
   */
  testStartedAt?: null | string | undefined
  /**
   * An array of A/B test URLs and the percentage of traffic to send to each URL.
   */
  testVariants?: Array<TestVariants> | null | undefined
  /**
   * The custom link preview title (og:title). Will be used for Custom Link Previews if `proxy` is true. Learn more: https://d.to/og
   */
  title?: null | string | undefined
  /**
   * Whether to track conversions for the short link. Defaults to `false` if not provided.
   */
  trackConversion?: boolean | undefined
  /**
   * The destination URL of the short link.
   */
  url: string
  /**
   * The UTM campaign of the short link. If set, this will populate or override the UTM campaign in the destination URL.
   */
  utmCampaign?: null | string | undefined
  /**
   * The UTM content of the short link. If set, this will populate or override the UTM content in the destination URL.
   */
  utmContent?: null | string | undefined
  /**
   * The UTM medium of the short link. If set, this will populate or override the UTM medium in the destination URL.
   */
  utmMedium?: null | string | undefined
  /**
   * The UTM source of the short link. If set, this will populate or override the UTM source in the destination URL.
   */
  utmSource?: null | string | undefined
  /**
   * The UTM term of the short link. If set, this will populate or override the UTM term in the destination URL.
   */
  utmTerm?: null | string | undefined
  /**
   * The custom link preview video (og:video). Will be used for Custom Link Previews if `proxy` is true. Learn more: https://d.to/og
   */
  video?: null | string | undefined
  /**
   * An array of webhook IDs to trigger when the link is clicked. These webhooks will receive click event data.
   */
  webhookIds?: Array<string> | null | undefined
}

export type DubCollection =
  | {
      docs: CollectionSlug
      slugOverride?: string
    }
  | CollectionSlug

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type DubConfig = {
  collections?: DubCollection[]
  disabled?: boolean
  domain?: string
  dubApiKey: string
  dubCollection?: {
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  }
  dubTagCollection?: {
    overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  }
  isPro?: boolean
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
  /**
   * The access level of the folder within the workspace.
   */
  accessLevel?: AccessLevel | null | undefined
  /**
   * The date the folder was created.
   */
  createdAt: string
  /**
   * The description of the folder.
   */
  description: null | string
  /**
   * The unique ID of the folder.
   */
  id: string
  /**
   * The name of the folder.
   */
  name: string
  type: FolderType
  /**
   * The date the folder was updated.
   */
  updatedAt: string
}

export type DubTags = {
  _status?: string
  dubTags?: ({ id: string } | string)[]
  id: string
  slug: string
}

export const FolderType = {
  Default: 'default',
  Mega: 'mega',
} as const

export type FolderType = ClosedEnum<typeof FolderType>

export type TestVariants = {
  percentage: number
  url: string
}
