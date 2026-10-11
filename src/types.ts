import { type CollectionConfig, type CollectionSlug, type Field, type GlobalConfig } from 'payload'
import { type Dub } from 'dub'

export type ClosedEnum<T> = T[keyof T]

export type DubTypes = NonNullable<Parameters<Dub['links']['create']>[0]>

export type DubUpdate = NonNullable<Parameters<Dub['links']['update']>[1]>

export type DubFolder = Awaited<ReturnType<Dub['folders']['create']>>

export type DubTagColor = NonNullable<NonNullable<Parameters<Dub['tags']['create']>[0]>['color']>

export type TestVariants = NonNullable<DubTypes['testVariants']>[number]

export const AccessLevel = {
  Read: 'read',
  Write: 'write',
} as const

export type AccessLevel = ClosedEnum<typeof AccessLevel>

export const FolderType = {
  Default: 'default',
  Mega: 'mega',
} as const

export type FolderType = ClosedEnum<typeof FolderType>

export const DubColors = {
  Blue: 'blue',
  Brown: 'brown',
  Gray: 'gray',
  Green: 'green',
  Pink: 'pink',
  Purple: 'purple',
  Red: 'red',
  Yellow: 'yellow',
} as const satisfies Record<string, DubTagColor>

export type DubCollection =
  | CollectionSlug
  | {
      docs: CollectionSlug
      slugOverride?: string
    }

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

type CollectionOverride = Partial<Omit<CollectionConfig, 'fields'>> & {
  fields?: FieldsOverride
}

export type DubConfig = {
  baseUrl?: string
  collections?: DubCollection[]
  disabled?: boolean
  domain?: string
  dubApiKey: string
  dubCollection?: {
    overrides?: CollectionOverride
  }
  dubTagCollection?: {
    overrides?: CollectionOverride
  }
  dubAnalytics?: {
    overrides?: Partial<GlobalConfig>
  }
  isPro?: boolean
  siteUrl: string
  tenantId?: string
}

export type DubTags = {
  _status?: string
  dubTags?: (string | number | { id: string | number })[] | null
  id: string | number
  slug: string
}
