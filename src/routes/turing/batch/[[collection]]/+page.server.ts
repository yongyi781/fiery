import { redirect } from "@sveltejs/kit"
import { collections } from "../../collections"
import type { PageServerLoad } from "./$types"

export const load = (async ({ params }) => {
  const key = params.collection
  if (key == null) return {}
  const collection = collections[key]
  if (!collection) redirect(302, "/turing/batch")
  return { collection }
}) satisfies PageServerLoad
