import type { TuringMachine } from "../routes/turing/turing"

export class TuringMachineCache {
  value: TuringMachine | undefined = $state()
}

export const turingMachineCache = new TuringMachineCache()
