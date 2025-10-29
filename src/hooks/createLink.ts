import { type Dub } from 'dub'
import {
  type CollectionAfterChangeHook,
} from 'payload'

import {
  type DubFolder,
  type DubTagSchema,
  type DubTypes,
} from '../types.js'

export const createDubHook =
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