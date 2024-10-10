import type { RequestHandler } from "./$types"

export const GET: RequestHandler = ({ params }) => {
  return fetch(`https://oeis.org/${params.anumber}?fmt=json`)
}
