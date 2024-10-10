import type { RequestHandler } from "./$types"

export const GET: RequestHandler = ({ url }) => {
  return fetch(
    `https://oeis.org/search?q=${url.searchParams.get("q") ?? "1,1,2,3,5,8"}&fmt=json&start=${url.searchParams.get("start") ?? 0}`
  )
}
