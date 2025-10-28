import { Dub } from 'dub'
import { type CollectionBeforeChangeHook, type Config, type Field } from 'payload'

import {
  DubColors,
  type DubConfig,
  type DubTagColor,
  type DubTagSchema,
  type DubTypes,
} from './types.js'

export const payloadDub =
  (pluginOptions: DubConfig) =>
  (config: Config): Config => {
    if (!pluginOptions.collections || pluginOptions.disabled) {
      return config
    }

    const dub = new Dub({ token: pluginOptions.dubApiKey })

    const validColors = new Set(Object.values(DubColors))

    const normalized: {
      color?: DubTagColor
      docs: string
      slugOverride?: string
    }[] = pluginOptions.collections.map((collection) => {
      if (typeof collection === 'string') {
        return { docs: collection }
      }

      const safeColor =
        typeof collection.color === 'string' && validColors.has(collection.color)
          ? collection.color
          : undefined

      return {
        color: safeColor,
        docs: collection.docs,
        slugOverride: collection.slugOverride,
      }
    })

    normalized.forEach(({ color, docs, slugOverride }) => {
      const targetSlug = slugOverride || docs
      const collection = config.collections?.find((col) => col.slug === docs)

      if (!collection) {
        return
      }

      const hasField = collection.fields.some(
        (field: Field) => 'name' in field && field.name === 'shortLink'
      )

      if (!hasField) {
        collection.fields.push({
          name: 'shortLink',
          type: 'text',
          admin: { position: 'sidebar', readOnly: true },
          label: 'Short link',
        })
      }

      const existingHooks = collection.hooks?.beforeChange || []
      collection.hooks = {
        ...collection.hooks,
        beforeChange: [
          ...existingHooks,
          createDubHook({
            slug: targetSlug,
            color,
            dub,
            siteUrl: pluginOptions.siteUrl,
            ...(pluginOptions.domain ? { domain: pluginOptions.domain } : {}),
            ...(pluginOptions.tenantId ? { tenantId: pluginOptions.tenantId } : {}),
          }),
        ],
      }
    })

    return config
  }

const createDubHook =
  ({
    slug,
    color,
    domain,
    dub,
    siteUrl,
    tenantId,
  }: {
    color?: DubTagColor
    domain?: string
    dub: Dub
    siteUrl: string
    slug: string
    tenantId?: string
  }): CollectionBeforeChangeHook =>
  async ({
    data,
    operation,
    originalDoc,
    req: { payload },
  }: Parameters<CollectionBeforeChangeHook>[0]) => {
    if (operation === 'create' || operation === 'update') {

      if (!data.slug) {
        return data
      }

      let tenant: string | undefined = undefined

      if (tenantId) {
        tenant = tenantId.startsWith('user_')
          ? tenantId
          : `user_${tenantId}`
      }

      const externalId = `ext_${slug}_${data.id}`
      const destinationUrl = `${siteUrl.replace(/\/$/, '')}/${slug}/${data.slug}`

      const linkData: DubTypes = {
        externalId,
        tagNames: [slug],
        url: destinationUrl,
        ...(domain ? { domain } : {}),
        ...(tenantId ? { tenantId: tenant } : {}),
      }

      try {
        const allTags = await dub.tags.list()
        const existingTag = allTags.find((tag: DubTagSchema) => tag.name === slug)

        if (!existingTag) {
          await dub.tags.create({
            name: slug,
            ...(color ? { color } : {}),
          })
        } else if (color && existingTag.color !== color) {
          await dub.tags.update(existingTag.id, { name: slug, color })
        }

        const response = await dub.links.upsert(linkData)

        if (!originalDoc?.shortLink && response.shortLink) {
          data.shortLink = response.shortLink
        }
      } catch (err) {
        payload.logger.error({
          error: err instanceof Error ? err.message : String(err),
          msg: `Link creation failed for ${slug}`,
        })
      }
    }

    return data
  }
