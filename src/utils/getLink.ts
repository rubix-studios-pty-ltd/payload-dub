import { type Dub } from 'dub'

export const getLink = async (dub: Dub, externalId: string) => {
  try {
    return await dub.links.get({ externalId })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 404
    ) {
      return null
    }

    throw error
  }
}
