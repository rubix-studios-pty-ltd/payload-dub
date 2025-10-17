import { Dub } from 'dub'
import { type CollectionAfterChangeHook, type Config, type Field } from 'payload'

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

      const existingHooks = collection.hooks?.afterChange || []
      collection.hooks = {
        ...collection.hooks,
        afterChange: [
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
  }): CollectionAfterChangeHook =>
  async ({
    collection,
    context,
    doc,
    operation,
    req: { payload },
  }: Parameters<CollectionAfterChangeHook>[0]) => {
    if (context.createDub === false) {return}

    if (operation === 'create' || operation === 'update') {
      const tenant = tenantId?.startsWith('user_') ? tenantId : `user_${tenantId}`
      const externalId = `ext_${slug}_${doc.id}`
      const destinationUrl = `${siteUrl.replace(/\/$/, '')}/${slug}/${doc.slug}`

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

        if (!doc.shortlink) {
          await payload.update({
            id: doc.id,
            collection: collection.slug,
            context: { createDub: false },
            data: {
              shortLink: response.shortLink ?? response.url,
            },
            overrideAccess: true,
          })
        }
      } catch (err) {
        payload.logger.error(`Link creation failed for ${slug}:`, err)
      }
    }

    return doc
  }
