# PayloadCMS + Dub Plugin

A Payload CMS plugin that integrates with Dub to automatically create and manage shortlinks for your content.
This plugin synchronizes your Payload collections with Dub.co, ensuring that every published document gets a corresponding shortlink, tag, and color configuration.

[![npm version](https://img.shields.io/npm/v/@rubixstudios/payload-dub.svg)](https://www.npmjs.com/package/@rubixstudios/payload-dub)
![Release](https://github.com/rubix-studios-pty-ltd/payload-dub/actions/workflows/release.yml/badge.svg)

Dub is the modern, open-source link attribution platform for short links, conversion tracking, and affiliate programs.

Create a free Dub account: [Dub](https://refer.dub.co/rubixstudios)

<img width="1912" height="914" alt="Link Analytics Dashboard" src="https://github.com/user-attachments/assets/a465f62a-6d9d-440d-a693-b0a10f9e9cdc" />

## Compatibility

The plugin maintains two release lines, with Payload CMS v4 as the primary release and Payload CMS v3 maintained separately.

| Payload CMS | Plugin version | Release branch | npm dist-tag |
| --- | --- | --- | --- |
| v4 | 2.x | `main` | `latest` |
| v3 | 1.x | `payload-v3` | `payload-v3` |

Install the release matching your Payload version. The `latest` tag targets Payload v4 after the v4 release is published.

## Installation

```sh
pnpm add @rubixstudios/payload-dub
```

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import { payloadDub } from '@rubixstudios/payload-dub'

export default buildConfig({
  plugins: [
    payloadDub({
      baseUrl: process.env.DUB_BASE_URL, // Optional: self hosted Dub url
      collections: [
        { docs: 'posts', slugOverride: 'post' }, // Custom slug used for folder and shortlinks
        { docs: 'insights', slugOverride: 'insight' }, // Custom slug only
        { docs: 'news' }, // Default behavior
      ],
      dubApiKey: process.env.DUB_API_KEY!,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
      domain: 'mycustomdomain.com', // Optional: assign a custom domain
      tenantId: '12345', // Optional: tenant identifier for workspace
      isPro: false, // Optional: pro flag to enable/disable pro features

      // Optional: overrides of dubCollection
      dubCollection: {
        overrides: {
          access: {
            read: ({ req }) => !!req.user,
            create: ({ req }) => !!req.user,
          },
          admin: {
            group: 'Marketing',
            defaultColumns: ['shortLink', 'externalId'],
          },
        },
      },
      dubTagCollection: {
        overrides: {
          access: {
            read: ({ req }) => !!req.user,
          },
          admin: {
            group: 'Marketing',
            defaultColumns: ['name', 'color'],
          },
        },
      },
      dubAnalytics: {
        overrides: {
          access: {
            read: ({ req }) => !!req.user,
          },
          admin: {
            group: 'Marketing',
          },
        },
      },
    }),
  ],
})
```

## Notes

If you do not provide optional overrides, the plugin defaults to:

- Links readable by all
- Tags are readable, editable, and deletable by all logged in users

## Features

- **Automation**: Generates and updates shortlinks when documents are published or slugs change.
- **Folders**: Collections are organised in folders (Pro).
- **Tags**: Tags can be created and removed directly in Payload.
- **Analytics**: Dashboard for campaign attribution, with advanced reporting (Pro).
- **Sync**: Keeps Payload and Dub data consistent with minimal overhead.
- **Configurable**: Supports per-collection overrides for color, slug, and URL base.
- **Access Control**: Access, field and admin overrides for complete CMS control.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or inquiries:

- LinkedIn: [rubixvi](https://www.linkedin.com/in/rubixvi/)
- Website: [Rubix Studios](https://rubixstudios.com.au)

## Author

Rubix Studios  
[https://rubixstudios.com.au](https://rubixstudios.com.au)
