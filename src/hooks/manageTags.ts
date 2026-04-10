import { type CollectionAfterDeleteHook, type CollectionBeforeChangeHook } from 'payload'

import { type DubTagColor } from '../types.js'
import { type GetDub } from '../utils/dubClient.js'

export const manageTags = (getDub: GetDub) => {
  const beforeChange: CollectionBeforeChangeHook = async ({
    context,
    data,
    originalDoc,
    req: { payload },
  }) => {
    if (context?.skipDubHook) {
      return data
    }

    if (!data.name || typeof data.name !== 'string') {
      return data
    }

    try {
      const dub = await getDub()

      let tagID: string

      if (originalDoc?.tagID) {
        await dub.tags.update(originalDoc.tagID, {
          name: data.name,
          color: data.color as DubTagColor,
        })

        tagID = originalDoc.tagID
      } else {
        const created = await dub.tags.create({
          name: data.name,
          color: data.color as DubTagColor,
        })

        tagID = created.id
      }

      data.tagID = tagID
      return data
    } catch (error) {
      payload.logger.error({ error, message: 'Tag create/update failed' })
      return data
    }
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req: { payload } }) => {
    if (!doc.tagID) {
      return
    }

    try {
      const dub = await getDub()

      await dub.tags.delete(doc.tagID)
    } catch (error) {
      payload.logger?.error?.({ error, message: 'Tag delete failed' })
    }
  }

  return { afterDelete, beforeChange }
}
