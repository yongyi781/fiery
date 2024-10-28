import { randomChoice } from "$lib/utils"
import { redirect } from "@sveltejs/kit"
import machines from "../machines-client"
import { parseTMRule } from "../turing"
import type { PageServerLoad } from "./$types"

export const load = (async ({ params }) => {
  const code = params.code
  if (code == null || parseTMRule(code).length === 0) redirect(302, `/turing/${randomChoice(machines)}`)
  return { code }
}) satisfies PageServerLoad
