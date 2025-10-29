import { Dub } from 'dub'
import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionConfig,
  type Config,
  type Field,
} from 'payload'

import {
  DubColors,
  type DubConfig,
  type DubFolder,
  type DubLinks,
  type DubTagSchema,
  type DubTypes,
} from './types.js'

export const payloadDub =
  (pluginConfig: DubConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig.collections || pluginConfig.disabled) {
      return incomingConfig
    }
    const enabled = pluginConfig.collections

    const dub = new Dub({ token: pluginConfig.dubApiKey })

    const defaultFields: Field[] = [
      {
        name: 'shortLink',
        type: 'text',
        required: true,
      },
      {
        name: 'externalId',
        type: 'text',
        admin: {
          readOnly: true,
        },
        required: true,
      },
      {
        name: 'tags',
        type: 'relationship',
        hasMany: true,
        relationTo: 'dubTags',
        required: false,
      },
      {
        name: 'source',
        type: 'relationship',
        relationTo: pluginConfig.collections.map((c) => (typeof c === 'string' ? c : c.docs)),
        required: true,
      },
    ]

    const dubCollection: CollectionConfig = {
      ...(pluginConfig.overrides || {}),
      slug: pluginConfig.overrides?.slug || 'dubLinks',
      access: {
        read: () => true,
        ...(pluginConfig.overrides?.access || {}),
      },
      admin: {
        group: 'Dub',
        useAsTitle: 'shortLink',
        ...(pluginConfig.overrides?.admin || {}),
      },
      fields:
        pluginConfig?.overrides?.fields && typeof pluginConfig?.overrides?.fields === 'function'
          ? pluginConfig?.overrides?.fields({ defaultFields })
          : defaultFields,
      labels: {
        plural: 'Shortlinks',
        singular: 'Shortlink',
      },
    }

    const tagCollection: CollectionConfig = {
      ...(pluginConfig.overrides || {}),
      slug: 'dubTags',
      access: {
        read: () => true,
        ...(pluginConfig.overrides?.access || {}),
      },
      admin: {
        group: 'Dub',
        useAsTitle: 'name',
        ...(pluginConfig.overrides?.admin || {}),
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'color',
          type: 'select',
          options: Object.values(DubColors).map((color) => ({
            label: color.charAt(0).toUpperCase() + color.slice(1),
            value: color,
          })),
          required: true,
        },
      ],
      hooks: {
        afterChange: [createDubTagHooks(dub).afterChange],
        afterDelete: [createDubTagHooks(dub).afterDelete],
      },
      labels: {
        plural: 'Tags',
        singular: 'Tag',
      },
    }

    const incomingCollections = incomingConfig.collections || []

    const updatedCollections: CollectionConfig[] = [
      ...incomingCollections,
      dubCollection,
      tagCollection,
    ]

    const collectionsWithHooks = updatedCollections.map((collection) => {
      const shouldAttachHook = enabled.some((c) =>
        typeof c === 'string' ? c === collection.slug : c.docs === collection.slug
      )

      if (!shouldAttachHook) {
        return collection
      }

      return {
        ...collection,
        hooks: {
          ...(collection.hooks || {}),
          afterChange: [
            ...(collection.hooks?.afterChange || []),
            createDubHook({
              slug: collection.slug,
              domain: pluginConfig.domain,
              dub,
              siteUrl: pluginConfig.siteUrl,
              tenantId: pluginConfig.tenantId,
            }),
          ],
        },
      }
    })

    return {
      ...incomingConfig,
      collections: collectionsWithHooks,
    }
  }

const createDubHook =
  ({
    slug,
    domain,
    dub,
    siteUrl,
    tenantId,
  }: {
    domain?: string
    dub: Dub
    siteUrl: string
    slug: string
    tenantId?: string
  }): CollectionAfterChangeHook =>
  async ({
    context,
    doc,
    operation,
    req: { payload },
  }: Parameters<CollectionAfterChangeHook>[0]) => {
    if (context?.skipDubHook) {
      return doc
    }

    if ((operation === 'create' || operation === 'update') && doc._status === 'published') {
      try {
        const folders = await dub.folders.list()
        let folder = folders.find((folder: DubFolder) => folder.name === slug)

        if (!folder) {
          folder = await dub.folders.create({ name: slug })
        }

        let tenant: string | undefined

        if (tenantId) {
          if (tenantId.startsWith('user_')) {
            tenant = tenantId
          } else {
            tenant = `user_${tenantId}`
          }
        } else {
          tenant = undefined
        }

        const originalDoc = await payload.find({
          collection: 'dubLinks',
          limit: 1,
          overrideAccess: true,
          where: {
            'source.value': {
              equals: doc.id,
            },
          },
        })

        const existingLinkDoc = originalDoc.docs[0]
        const existingLink = existingLinkDoc?.shortLink

        const unchanged =
          existingLink && JSON.stringify(doc.tags) === JSON.stringify(existingLinkDoc?.tags)

        if (unchanged) {
          return doc
        }

        let newLink: typeof existingLinkDoc | undefined = existingLinkDoc

        if (!existingLinkDoc) {
          newLink = await payload.create({
            collection: 'dubLinks',
            data: {
              source: {
                relationTo: slug,
                value: doc.id,
              },
            },
            overrideAccess: true,
          })
        }

        if (!newLink) {
          payload.logger.error({ message: 'Failed to create or retrieve Dub link' })
          return doc
        }

        const legacyId = `ext_${slug}_${doc.id}`
        const newId = `ext_${slug}_${newLink.id}`

        const externalId =
          existingLinkDoc?.externalId ??
          (newLink.id ? newId : undefined) ??
          legacyId

        const destinationUrl = `${siteUrl.replace(/\/$/, '')}/${slug}/${doc.slug}`

        const linkData: DubTypes = {
          externalId,
          folderId: folder.id,
          tagIds: Array.isArray(doc.tags) ? doc.tags.map((tag: DubTagSchema) => tag.id) : [],
          url: destinationUrl,
          ...(domain ? { domain } : {}),
          ...(tenantId ? { tenantId: tenant } : {}),
        }

        const response = await dub.links.upsert(linkData)

        const needsIdUpdate =
          !existingLinkDoc?.externalId || existingLinkDoc.externalId !== externalId

        const needsUpdate =
          !existingLink || existingLink.trim() === '' || existingLink !== response.shortLink

        if (needsIdUpdate || needsUpdate) {
          await payload.update({
            id: newLink.id,
            collection: 'dubLinks',
            context: { skipDubHook: true },
            data: {
              externalId,
              shortLink: response.shortLink,
            },
            overrideAccess: true,
          })
        }
      } catch (error) {
        payload.logger.error({ error, message: 'Error creating/updating Dub link' })
      }
    }

    return doc
  }

const createDubTagHooks = (dub: Dub) => {
  const afterChange: CollectionAfterChangeHook = async ({
    context,
    doc,
    previousDoc,
    req: { payload },
  }) => {
    if (context?.skipDubHook) {
      return doc
    }

    try {
      const tags: DubTagSchema[] = await dub.tags.list()

      const previousTag = previousDoc?.name
        ? tags.find((t) => t.name === previousDoc.name)
        : undefined

      const currentTag = tags.find((t) => t.name === doc.name)
      const existing = previousTag || currentTag

      if (!existing) {
        await dub.tags.create({
          name: doc.name,
          color: doc.color,
        })
        return doc
      }

      const nameChanged = existing.name !== doc.name
      const colorChanged = !!doc.color && existing.color !== doc.color
      if (nameChanged || colorChanged) {
        await dub.tags.update(existing.id, {
          name: doc.name,
          ...(doc.color ? { color: doc.color } : {}),
        })
      }
    } catch (error) {
      payload.logger.error({ error, message: 'Dub tag sync failed' })
    }
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req: { payload } }) => {
    try {
      const tags: DubTagSchema[] = await dub.tags.list()
      const match = tags.find((tag) => tag.name === doc?.name)
      if (!match) {
        return
      }

      const links = await dub.links.list()
      const inUse = Array.isArray(links)
        ? links.some((link: DubLinks) => (Array.isArray(link.tagIds) ? link.tagIds.includes(match.id) : false))
        : false

      if (!inUse) {
        await dub.tags.delete(match.id)
      } else {
        payload.logger?.info?.({
          message: 'Skipped Dub tag delete. Tag still in use.',
          tag: match.name,
          tagId: match.id,
        })
      }
    } catch (error) {
      payload.logger?.error?.({ error, message: 'Dub tag delete failed' })
    }
  }

  return { afterChange, afterDelete }
}
