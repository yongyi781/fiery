import { randomChoice } from "$lib/utils"
import machines from "../machines"
import { parseTMRule } from "../turing"
import type { PageServerLoad } from "./$types"

export const load = (async ({ params }) => {
  let code = params.code ?? ""
  if (parseTMRule(code).length === 0) code = randomChoice(machines)
  return { code }
}) satisfies PageServerLoad
