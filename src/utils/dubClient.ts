export type GetDub = () => Promise<import('dub').Dub>

export const dubClient = (apiKey: string): GetDub => {
  let client: import('dub').Dub | null = null

  return async () => {
    if (client) return client

    const { Dub } = await import('dub')
    client = new Dub({ token: apiKey })

    return client
  }
}
