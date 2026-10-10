import { type CollectionConfig, type CollectionSlug, type Field, type Plugin } from 'payload'
import { Dub } from 'dub'

import { createSingle } from './hooks/createSingle.js'
import { manageLinks } from './hooks/manageLinks.js'
import { manageTags } from './hooks/manageTags.js'
import { DubColors, type DubConfig } from './types.js'

export const payloadDub =
  (pluginConfig: DubConfig): Plugin =>
  (incomingConfig) => {
    const enabled = pluginConfig.collections

    if (pluginConfig.disabled || !enabled?.length) {
      return incomingConfig
    }

    const linksOverride = pluginConfig.dubCollection?.overrides
    const tagsOverride = pluginConfig.dubTagCollection?.overrides

    const linksSlug = (linksOverride?.slug || 'dubLinks') as CollectionSlug
    const tagsSlug = (tagsOverride?.slug || 'dubTags') as CollectionSlug

    const sources = [
      ...new Set(
        enabled.map((collection) => (typeof collection === 'string' ? collection : collection.docs))
      ),
    ]

    const dub = new Dub({ token: pluginConfig.dubApiKey })

    const linkHooks = manageLinks(dub, tagsSlug)
    const tagHooks = manageTags(dub)

    const linksFields: Field[] = [
      {
        name: 'externalId',
        type: 'text',
        admin: {
          readOnly: true,
        },
        unique: true,
      },
      {
        name: 'shortLink',
        type: 'text',
        admin: {
          readOnly: true,
        },
        unique: true,
      },
      {
        name: 'dubTags',
        type: 'relationship',
        hasMany: true,
        relationTo: tagsSlug,
      },
      {
        name: 'source',
        type: 'relationship',
        relationTo: sources,
        required: true,
      },
    ]

    const tagsFields: Field[] = [
      {
        name: 'tagID',
        type: 'text',
        access: {
          read: () => true,
          update: () => true,
        },
        admin: {
          readOnly: true,
        },
        label: 'Tag ID',
        unique: true,
      },
      {
        name: 'name',
        type: 'text',
        required: true,
        unique: true,
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
    ]

    const dubLinks: CollectionConfig = {
      ...linksOverride,
      slug: linksSlug,
      access: {
        read: () => true,
        update: () => true,
        ...linksOverride?.access,
      },
      admin: {
        group: 'Dub',
        useAsTitle: 'shortLink',
        ...linksOverride?.admin,
      },
      fields: linksOverride?.fields
        ? linksOverride.fields({ defaultFields: linksFields })
        : linksFields,
      hooks: {
        ...linksOverride?.hooks,
        afterDelete: [...(linksOverride?.hooks?.afterDelete || []), linkHooks.afterDelete],
        beforeChange: [...(linksOverride?.hooks?.beforeChange || []), linkHooks.beforeChange],
      },
      labels: {
        plural: 'Links',
        singular: 'Link',
        ...linksOverride?.labels,
      },
    }

    const dubTags: CollectionConfig = {
      ...tagsOverride,
      slug: tagsSlug,
      access: {
        read: () => true,
        update: () => true,
        ...tagsOverride?.access,
      },
      admin: {
        group: 'Dub',
        useAsTitle: 'name',
        ...tagsOverride?.admin,
      },
      fields: tagsOverride?.fields
        ? tagsOverride.fields({ defaultFields: tagsFields })
        : tagsFields,
      hooks: {
        ...tagsOverride?.hooks,
        afterDelete: [...(tagsOverride?.hooks?.afterDelete || []), tagHooks.afterDelete],
        beforeChange: [...(tagsOverride?.hooks?.beforeChange || []), tagHooks.beforeChange],
      },
      labels: {
        plural: 'Tags',
        singular: 'Tag',
        ...tagsOverride?.labels,
      },
    }

    const collections = (incomingConfig.collections || []).map((collection): CollectionConfig => {
      const match = enabled.find((item) =>
        typeof item === 'string' ? item === collection.slug : item.docs === collection.slug
      )

      if (!match) {
        return collection
      }

      const targetSlug = typeof match === 'string' ? match : match.slugOverride || match.docs

      const fields: Field[] = [...collection.fields]

      if (!fields.some((field) => 'name' in field && field.name === 'dubLink')) {
        fields.push({
          name: 'dubLink',
          type: 'text',
          admin: {
            position: 'sidebar',
            readOnly: true,
          },
          hooks: {
            afterRead: [
              async ({ originalDoc, req }) => {
                if (originalDoc?.id === undefined || originalDoc.id === null) {
                  return ''
                }

                try {
                  const result = await req.payload.find({
                    collection: linksSlug,
                    depth: 0,
                    limit: 1,
                    overrideAccess: true,
                    req,
                    select: {
                      shortLink: true,
                    },
                    where: {
                      and: [
                        {
                          'source.relationTo': {
                            equals: collection.slug,
                          },
                        },
                        {
                          'source.value': {
                            equals: originalDoc.id,
                          },
                        },
                      ],
                    },
                  })

                  return result.docs[0]?.shortLink || ''
                } catch (error) {
                  req.payload.logger.error({
                    err: error,
                    msg: 'Failed to read Dub shortlink',
                  })

                  return ''
                }
              },
            ],
          },
        })
      }

      if (!fields.some((field) => 'name' in field && field.name === 'dubTags')) {
        fields.push({
          name: 'dubTags',
          type: 'relationship',
          admin: {
            allowCreate: true,
            position: 'sidebar',
          },
          hasMany: true,
          relationTo: tagsSlug,
        })
      }

      return {
        ...collection,
        fields,
        hooks: {
          ...collection.hooks,
          afterChange: [
            ...(collection.hooks?.afterChange || []),
            createSingle({
              slug: targetSlug,
              domain: pluginConfig.domain,
              dub,
              isPro: pluginConfig.isPro,
              linksSlug,
              originalSlug: collection.slug,
              siteUrl: pluginConfig.siteUrl,
              tagsSlug,
              tenantId: pluginConfig.tenantId,
            }),
          ],
        },
      }
    })

    return {
      ...incomingConfig,
      collections: [...collections, dubLinks, dubTags],
    }
  }
