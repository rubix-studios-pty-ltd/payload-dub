export type GetDub = () => Promise<import('dub').Dub>

export const dubClient = (apiKey: string): GetDub => {
  let client: import('dub').Dub | null = null
  let init: Promise<import('dub').Dub> | null = null

  return async () => {
    if (client) return client

    if (!init) {
      init = import('dub').then(({ Dub }) => {
        client = new Dub({ token: apiKey })
        return client
      })
    }

    return await init
  }
}
