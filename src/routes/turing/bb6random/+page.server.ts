import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { randomChoice } from "$lib/utils"
import { bb6Holdouts } from "./bb6holdouts"

export const load = (async () => {
  redirect(302, `/turing/${randomChoice(bb6Holdouts)}`)
}) satisfies PageServerLoad
