import { type CollectionSlug, type GlobalConfig } from 'payload'

type Props = {
  dubApiKey: string
  isPro?: boolean
  linksSlug: CollectionSlug
  overrides?: Partial<GlobalConfig>
  tenantId?: string
}

export function getAnalytics({
  dubApiKey,
  isPro = false,
  linksSlug,
  overrides,
  tenantId,
}: Props): GlobalConfig {
  return {
    ...overrides,
    slug: overrides?.slug || 'dubAnalytics',
    label: overrides?.label || 'Analytics',
    access: {
      read: ({ req }) => Boolean(req.user && req.user.collection === req.payload.config.admin.user),
      update: () => false,
      ...overrides?.access,
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
      ...overrides?.admin,
    },
    fields: overrides?.fields ?? [],
  }
}
