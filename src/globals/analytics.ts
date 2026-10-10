import { type CollectionSlug, type GlobalConfig } from 'payload'

type Props = {
  dubApiKey: string
  isPro?: boolean
  linksSlug: CollectionSlug
  tenantId?: string
}

export function getAnalytics({
  dubApiKey,
  isPro = false,
  linksSlug,
  tenantId,
}: Props): GlobalConfig {
  return {
    slug: 'dubAnalytics',
    label: 'Analytics',
    access: {
      read: ({ req }) => Boolean(req.user && req.user.collection === req.payload.config.admin.user),
      update: () => false,
    },
    admin: {
      group: 'Dub',
      components: {
        views: {
          edit: {
            root: {
              Component: {
                path: '@rubixstudios/payload-dub/analytics#DubAnalytics',
                serverProps: {
                  dubApiKey,
                  isPro,
                  linksSlug,
                  tenantId,
                },
              },
            },
          },
        },
      },
    },
    fields: [],
  }
}
