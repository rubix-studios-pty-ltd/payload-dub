import {
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type CollectionSlug,
} from 'payload'
import { type Dub } from 'dub'

import { type DubUpdate } from '../types.js'
import { getLink } from '../utils/getLink.js'

export const manageLinks = (dub: Dub, tagsSlug: CollectionSlug = 'dubTags') => {
  const beforeChange: CollectionBeforeChangeHook = async ({ context, data, originalDoc, req }) => {
    if (context?.skipDubHook) {
      return data
    }

    const externalId = data.externalId || originalDoc?.externalId

    if (!externalId) {
      return data
    }

    const { payload } = req

    try {
      const existing = await getLink(dub, originalDoc?.externalId || externalId)

      const syncTags = data.dubTags !== undefined || !existing
      const tags = data.dubTags !== undefined ? data.dubTags : originalDoc?.dubTags

      const payloadTagIds = [
        ...new Set(
          syncTags && Array.isArray(tags)
            ? tags
                .map((tag) => (typeof tag === 'object' && tag !== null ? tag.id : tag))
                .filter(
                  (id): id is string | number => typeof id === 'string' || typeof id === 'number'
                )
            : []
        ),
      ]

      const query = payloadTagIds.length
        ? await payload.find({
            collection: tagsSlug,
            depth: 0,
            limit: payloadTagIds.length,
            overrideAccess: true,
            req,
            where: { id: { in: payloadTagIds } },
          })
        : null

      const dubTagIds = [
        ...new Set(
          query?.docs
            .map((tag) => tag.tagID)
            .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? []
        ),
      ]

      const updateData: DubUpdate = {
        externalId,
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(syncTags ? { tagIds: dubTagIds } : {}),
      }

      if (existing) {
        const updated = await dub.links.update(existing.id, updateData)

        return {
          ...data,
          shortLink: updated.shortLink,
        }
      }

      const url = data.url ?? originalDoc?.url

      if (!url) {
        payload.logger.warn({
          msg: `Missing URL for Dub shortlink creation (${externalId})`,
        })

        return data
      }

      const created = await dub.links.create({
        externalId,
        tagIds: dubTagIds,
        url,
      })

      return {
        ...data,
        shortLink: created.shortLink,
      }
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Failed to create or update Dub shortlink',
      })

      return data
    }
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ context, doc, req: { payload } }) => {
    if (context?.skipDubHook || !doc?.externalId) {
      return doc
    }

    try {
      const existing = await getLink(dub, doc.externalId)

      if (existing) {
        await dub.links.delete(existing.id)
      }
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Failed to delete Dub shortlink',
      })
    }

    return doc
  }

  return { afterDelete, beforeChange }
}
