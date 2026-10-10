import { type CollectionSlug, type Field } from 'payload'

type Props = {
  sources: CollectionSlug[]
  tagsSlug: CollectionSlug
}

export function getLinks({ sources, tagsSlug }: Props): Field[] {
  return [
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
}
