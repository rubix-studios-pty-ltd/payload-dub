import { Dub } from 'dub'
import { type CollectionConfig, type Config, type Field } from 'payload'

import { createDubHook } from './hooks/createLink.js'
import { createDubTagHooks } from './hooks/createTag.js'
import { DubColors, type DubConfig } from './types.js'

export const payloadDub =
  (pluginConfig: DubConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig.collections || pluginConfig.disabled) {
      return incomingConfig
    }

    const enabled = pluginConfig.collections
    const dub = new Dub({ token: pluginConfig.dubApiKey })

    const tagHooks = createDubTagHooks(dub)

    const defaultFields: Field[] = [
      {
        name: 'shortLink',
        type: 'text',
        required: false,
        unique: true,
      },
      {
        name: 'externalId',
        type: 'text',
        admin: {
          readOnly: true,
        },
        required: false,
        unique: true,
      },
      {
        name: 'dubTags',
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

    const defaultTagFields: Field[] = [
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
        required: false,
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

    const dubCollection: CollectionConfig = {
      ...(pluginConfig.overrides || {}),
      slug: pluginConfig.overrides?.dubCollection?.slug || 'dubLinks',
      access: {
        read: () => true,
        update: () => true,
        ...(pluginConfig.overrides?.dubCollection?.access || {}),
      },
      admin: {
        group: 'Dub',
        useAsTitle: 'shortLink',
        ...(pluginConfig.overrides?.dubCollection?.admin || {}),
      },
      fields:
        pluginConfig?.overrides?.dubCollection?.fields &&
        typeof pluginConfig?.overrides?.dubCollection?.fields === 'function'
          ? pluginConfig?.overrides?.dubCollection?.fields({ defaultFields })
          : defaultFields,
      labels: {
        plural: 'Links',
        singular: 'Link',
      },
    }

    const tagCollection: CollectionConfig = {
      ...(pluginConfig.overrides || {}),
      slug: pluginConfig.overrides?.dubTagCollection?.slug || 'dubTags',
      access: {
        read: () => true,
        update: () => true,
        ...(pluginConfig.overrides?.dubTagCollection?.access || {}),
      },
      admin: {
        group: 'Dub',
        useAsTitle: 'name',
        ...(pluginConfig.overrides?.dubTagCollection?.admin || {}),
      },
      fields:
        pluginConfig?.overrides?.dubTagCollection?.fields &&
        typeof pluginConfig?.overrides?.dubTagCollection?.fields === 'function'
          ? pluginConfig?.overrides?.dubTagCollection?.fields({ defaultFields: defaultTagFields })
          : defaultTagFields,
      hooks: {
        afterDelete: [tagHooks.afterDelete],
        beforeChange: [tagHooks.beforeChange],
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
      const configMatch = enabled.find((col) =>
        typeof col === 'string' ? col === collection.slug : col.docs === collection.slug
      )

      if (!configMatch) {
        return collection
      }

      let targetSlug: string

      if (typeof configMatch === 'string') {
        targetSlug = configMatch
      } else {
        targetSlug = configMatch.slugOverride || configMatch.docs
      }

      const attachFields = [...(collection.fields || [])]

      if (!attachFields.some((field) => 'name' in field && field.name === 'dubTags')) {
        attachFields.push({
          name: 'dubTags',
          type: 'relationship',
          admin: {
            allowCreate: true,
            position: 'sidebar',
          },
          hasMany: true,
          relationTo: 'dubTags',
          required: false,
        })
      }

      return {
        ...collection,
        fields: attachFields,
        hooks: {
          ...(collection.hooks || {}),
          afterChange: [
            ...(collection.hooks?.afterChange || []),
            createDubHook({
              slug: targetSlug,
              domain: pluginConfig.domain,
              dub,
              originalSlug: collection.slug,
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
