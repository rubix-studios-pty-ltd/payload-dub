import { type CollectionAfterDeleteHook, type CollectionBeforeChangeHook } from 'payload'
import { type Dub } from 'dub'

import { type DubTagColor } from '../types.js'

export const manageTags = (dub: Dub) => {
  const beforeChange: CollectionBeforeChangeHook = async ({
    context,
    data,
    originalDoc,
    req: { payload },
  }) => {
    if (context?.skipDubHook) {
      return data
    }

    const name = data.name !== undefined ? data.name : originalDoc?.name
    const color = data.color !== undefined ? data.color : originalDoc?.color
    const tagID = originalDoc?.tagID

    if (typeof name !== 'string' || !name.trim()) {
      return data
    }

    if (tagID && name === originalDoc.name && color === originalDoc.color) {
      return {
        ...data,
        tagID,
      }
    }

    try {
      const input = {
        name,
        ...(color ? { color: color as DubTagColor } : {}),
      }

      const tag = tagID ? await dub.tags.update(tagID, input) : await dub.tags.create(input)

      return {
        ...data,
        tagID: tag.id,
        color: tag.color,
      }
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: 'Failed to create or update Dub tag',
      })

      return data
    }
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ context, doc, req: { payload } }) => {
    if (context?.skipDubHook || !doc?.tagID) {
      return doc
    }

    try {
      await dub.tags.delete(doc.tagID)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        error.statusCode === 404
      ) {
        return doc
      }

      payload.logger.error({
        err: error,
        msg: 'Failed to delete Dub tag',
      })
    }

    return doc
  }

  return { afterDelete, beforeChange }
}
