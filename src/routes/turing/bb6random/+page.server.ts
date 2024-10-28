import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { randomChoice } from "$lib/utils"
import { collections } from "../collections"

export const load = (async () => {
  redirect(302, `/turing/${randomChoice(collections["bb6-holdouts"])}`)
}) satisfies PageServerLoad
