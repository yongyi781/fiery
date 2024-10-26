import type { TuringMachine } from "./routes/turing/turing"

declare global {
  namespace App {
    interface Platform {
      env: Env
      cf: CfProperties
      ctx: ExecutionContext
    }
    interface PageState {
      /// Cached Turing machine instance, used when the user double clicks on the canvas in overview.
      tm?: TuringMachine
    }
  }
}

export {}
