import { type Dub } from 'dub'
import { type CollectionAfterDeleteHook, type CollectionBeforeChangeHook } from 'payload'

import { type DubTypes } from '../types.js'

export const manageLinks = (dub: Dub) => {
  const beforeChange: CollectionBeforeChangeHook = async ({
    context,
    data,
    originalDoc,
    req: { payload },
  }) => {
    if (context?.skipDubHook) {
      return data
    }

    if (!data?.externalId && !originalDoc?.externalId) {
      return data
    }

    const externalId = data.externalId || originalDoc.externalId

    try {
      const exists = await dub.links.get({ externalId }).catch(() => null)

      const payloadTagIds = Array.isArray(data.dubTags)
        ? data.dubTags.map((t) => (typeof t === 'string' ? t : t.id)).filter(Boolean)
        : []

      const dubTagsQuery = payloadTagIds.length
        ? await payload.find({
            collection: 'dubTags',
            limit: payloadTagIds.length,
            overrideAccess: true,
            where: { 
                id: { 
                    in: payloadTagIds 
                } 
            },
          })
        : null

      const dubTagIds = dubTagsQuery?.docs?.map((tag) => tag.tagID).filter(Boolean) ?? []

      const updateData: Partial<DubTypes> = {
        ...(data.shortLink ? { shortLink: data.shortLink } : {}),
        ...(dubTagIds.length ? { tagIds: dubTagIds } : {}),
      }

      if (exists) {
        await dub.links.update(externalId, updateData)
      } else {
        if (!data.url) {
          payload.logger.warn({
            message: `Missing URL for link creation: ${externalId}`,
          })
          return data
        }

        await dub.links.create({
          externalId,
          url: data.url,
          ...updateData,
        })
      }

      return data
    } catch (error) {
      payload.logger.error({ error, message: 'Dub link update failed' })
      return data
    }
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req: { payload } }) => {
    if (!doc?.externalId) {
      return
    }

    try {
      await dub.links.delete(doc.externalId)
    } catch (error) {
      payload.logger.error({ error, message: 'Dub link delete failed' })
    }
  }

  return { afterDelete, beforeChange }
}
