import { type Dub } from 'dub'
import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
} from 'payload'

import {
  type DubLinks,
  type DubTagSchema,
} from '../types.js'

export const createDubTagHooks = (dub: Dub) => {
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
