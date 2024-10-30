import type { TuringMachine } from "./turing"

export const turingMachineCache = $state({
  value: undefined as TuringMachine | undefined
})
