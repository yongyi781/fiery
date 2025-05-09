import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
  const response = await fetch(
    `https://oeis.org/search?q=${url.searchParams.get("q") ?? "1,1,2,3,5,8"}&fmt=json&start=${url.searchParams.get("start") ?? 0}`
  )
  const headers = new Headers(response.headers)
  headers.delete("content-encoding")
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  })
}
