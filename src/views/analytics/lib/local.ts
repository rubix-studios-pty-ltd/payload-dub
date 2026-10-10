import { type CollectionSlug, type Payload, type PayloadRequest } from 'payload'

import { PAGE_LIMIT, PAGE_SIZE } from '../constants.js'
import { type LocalLink } from '../types.js'

export async function localLinks(payload: Payload, req: PayloadRequest, slug: CollectionSlug) {
  const links: LocalLink[] = []

  for (let page = 1; page <= PAGE_LIMIT; page++) {
    const result = await payload.find({
      collection: slug,
      depth: 0,
      limit: PAGE_SIZE,
      page,
      overrideAccess: false,
      req,
      select: { externalId: true, source: true, shortLink: true },
    })

    for (const doc of result.docs) {
      const externalId = typeof doc.externalId === 'string' ? doc.externalId : ''
      const shortLink = typeof doc.shortLink === 'string' ? doc.shortLink : ''

      if (!externalId && !shortLink) continue

      const source = doc.source
      const relation =
        source && typeof source === 'object' && 'relationTo' in source
          ? String(source.relationTo)
          : 'Content'

      links.push({ id: String(doc.id), externalId, shortLink, source: relation })
    }

    if (!result.hasNextPage) return { links, complete: true }
  }

  return { links, complete: false }
}
