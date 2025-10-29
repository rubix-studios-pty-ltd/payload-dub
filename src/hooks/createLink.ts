import { type Dub } from 'dub'
import { type CollectionAfterChangeHook } from 'payload'

import { type DubFolder, type DubTags, type DubTypes } from '../types.js'

export const createDubHook =
  ({
    slug,
    domain,
    dub,
    isPro = false,
    originalSlug,
    siteUrl,
    tenantId,
  }: {
    domain?: string
    dub: Dub
    isPro?: boolean
    originalSlug: string
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

    if (!['create', 'update'].includes(operation) || doc._status !== 'published') {
      return doc
    }

    try {
      let folderId: string | undefined

      if (isPro === true) {
        const folders = await dub.folders.list()
        let folder = folders.find((f: DubFolder) => f.name === originalSlug)
        if (!folder) {
          folder = await dub.folders.create({ name: originalSlug })
        }
        folderId = folder.id
      }

      const lookup = await payload.find({
        collection: 'dubLinks',
        limit: 1,
        overrideAccess: true,
        where: { 'source.value': { equals: doc.id } },
      })

      let linkDoc = lookup.docs[0] // revert to const after migration

      // Temporary migration script to create missing links
      if (!linkDoc) {
        const legacy = `ext_${slug}_${doc.id}`
        const found = await dub.links.get({ externalId: legacy })

        const payloadTagIds: string[] = []

        if (found && Array.isArray(found.tags) && found.tags.length > 0) {
          const tagIds = found.tags.map((t) => t.id)

          const tagLookup = await payload.find({
            collection: 'dubTags',
            limit: tagIds.length,
            overrideAccess: true,
            where: { tagID: { in: tagIds } },
          })

          const existingTags = tagLookup.docs || []

          payloadTagIds.push(
            ...existingTags.map((t) => t.id).filter((id): id is string => typeof id === 'string')
          )

          for (const tag of found.tags) {
            const exists = existingTags.some((t) => t.tagID === tag.id)
            if (!exists) {
              const created = await payload.create({
                collection: 'dubTags',
                context: { skipDubHook: true },
                data: {
                  name: tag.name,
                  color: tag.color,
                  tagID: tag.id,
                },
                overrideAccess: true,
              })

              if (created?.id && typeof created.id === 'string') {
                payloadTagIds.push(created.id)
              }
            }
          }
        }

        if (found) {
          linkDoc = await payload.create({
            collection: 'dubLinks',
            context: { skipDubHook: true },
            data: {
              externalId: found.externalId?.startsWith('ext_')
                ? found.externalId
                : `ext_${found.externalId}`,
              shortLink: found.shortLink,
              source: { relationTo: originalSlug, value: doc.id },
              ...(payloadTagIds.length ? { dubTags: payloadTagIds } : {}),
            },
            overrideAccess: true,
          })
        }
      }

      const tid = tenantId
        ? tenantId.startsWith('user_')
          ? tenantId
          : `user_${tenantId}`
        : undefined

      const existingShort = linkDoc?.shortLink

      const document = doc as DubTags

      const payloadTagIds = Array.isArray(document.dubTags)
        ? document.dubTags.map((t) => t.id).filter(Boolean)
        : []

      const dubTagsQuery = payloadTagIds.length
        ? await payload.find({
            collection: 'dubTags',
            limit: payloadTagIds.length,
            overrideAccess: true,
            where: { id: { in: payloadTagIds } },
          })
        : null

      const dubTagIds =
        dubTagsQuery?.docs?.map((t) => t.tagID).filter((id): id is string => Boolean(id)) ?? []

      const link =
        linkDoc ||
        (await payload.create({
          collection: 'dubLinks',
          data: {
            source: {
              relationTo: originalSlug,
              value: doc.id,
            },
          },
          overrideAccess: true,
        }))

      const externalId = link.externalId?.startsWith('ext_')
        ? link.externalId
        : `ext_${slug}_${link.id}`
      const url = `${siteUrl.replace(/\/$/, '')}/${slug}/${doc.slug}`

      let tagMismatch = false

      if (existingShort) {
        const currentDubTags = await dub.links.get({ externalId })
        const dubTagIdsCurrent: string[] = Array.isArray(currentDubTags?.tags)
          ? currentDubTags.tags.map((t) => t.id)
          : []

        tagMismatch =
          dubTagIds.length !== dubTagIdsCurrent.length ||
          !dubTagIds.every((id) => dubTagIdsCurrent.includes(id))
      }

      if (existingShort && !tagMismatch) {
        return doc
      }

      const data: DubTypes = {
        externalId,
        ...(folderId ? { folderId } : {}),
        tagIds: dubTagIds,
        url,
        ...(domain ? { domain } : {}),
        ...(tid ? { tenantId: tid } : {}),
      }

      const updated = await dub.links.upsert(data)

      const requiresSync =
        !existingShort ||
        existingShort !== updated.shortLink ||
        tagMismatch ||
        link.externalId !== externalId

      if (requiresSync) {
        await payload.update({
          id: link.id,
          collection: 'dubLinks',
          context: { skipDubHook: true },
          data: {
            dubTags: payloadTagIds,
            externalId,
            shortLink: updated.shortLink,
          },
          overrideAccess: true,
        })
      }
    } catch (error) {
      payload.logger.error({ error, message: 'Error creating/updating Dub link' })
    }

    return doc
  }
