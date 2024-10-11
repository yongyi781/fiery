import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core"
import { createOnigurumaEngine } from "shiki/engine/oniguruma"

const mathReplacements: { [key: string]: string } = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  Theta: "Θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  Lambda: "Λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  Pi: "π", // OEIS likes to use Pi for pi, rather than capital Pi.
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  phi: "φ",
  Phi: "Φ",
  chi: "χ",
  psi: "ψ",
  Psi: "Ψ",
  omega: "ω",
  Omega: "Ω",
  sqrt: "√",
  Sum_: "∑_",
  Product_: "∏_",
  Integral_: "∫_",
  "<=": "≤",
  ">=": "≥",
  "<>": "≠",
  "+-": "±",
  "+/-": "±"
}

const mathReplacementRegex = new RegExp(
  Object.keys(mathReplacements)
    .map((key) => (key.match(/^\w+$/) ? `\\b${key}(\\b|(?=_))` : key.replace("+", "\\+")))
    .join("|"),
  "g"
)

let highlighter: HighlighterCore | undefined
createOnigurumaEngine(import("shiki/wasm")).then((engine) => {
  highlighter = createHighlighterCoreSync({
    langs: [
      {
        name: "math",
        patterns: [
          {
            name: "group.parentheses",
            begin: "\\(",
            end: "\\)",
            captures: { 0: { name: "bracket" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "group.brackets",
            begin: "\\[",
            end: "\\]",
            captures: { 0: { name: "bracket" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "group.braces",
            begin: "{",
            end: "}",
            captures: { 0: { name: "bracket" } },
            patterns: [{ include: "$self" }]
          },
          { name: "anumber", match: "A\\d{6}" },
          {
            name: "author",
            match: "(?<=[\\s\\[-]+|^)(_)(.+?)(_)",
            captures: { 1: { name: "hidden" }, 2: { name: "author.content" }, 3: { name: "hidden" } }
          },
          {
            name: "exponent.parentheses",
            contentName: "exponent.content",
            begin: "\\^\\(",
            end: "\\)",
            captures: { 0: { name: "hidden" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "exponent.braces",
            contentName: "exponent.content",
            begin: "\\^{",
            end: "}",
            captures: { 0: { name: "hidden" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "exponent",
            contentName: "exponent.content",
            begin: "\\^",
            end: "$|(?=[^a-zA-Z0-9^(])|(?<![a-zA-Z])(?=\\()",
            beginCaptures: { 0: { name: "hidden" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "subscript.parentheses",
            contentName: "subscript.content",
            begin: "\\_\\(",
            end: "\\)",
            captures: { 0: { name: "hidden" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "subscript.braces",
            contentName: "subscript.content",
            begin: "\\_{",
            end: "}",
            captures: { 0: { name: "hidden" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "subscript",
            contentName: "subscript.content",
            begin: "\\_(?!Reversion)", // Series_Reversion... come on
            end: "$|(?=[^a-zA-Z0-9_])|\\)",
            beginCaptures: { 0: { name: "hidden" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "floor",
            contentName: "floor.content",
            begin: "floor\\(",
            end: "\\)",
            beginCaptures: { 0: { name: "floor.begin" } },
            endCaptures: { 0: { name: "floor.end" } },
            patterns: [{ include: "$self" }]
          },
          {
            name: "ceiling",
            contentName: "ceiling.content",
            begin: "ceiling\\(",
            end: "\\)",
            beginCaptures: { 0: { name: "ceiling.begin" } },
            endCaptures: { 0: { name: "ceiling.end" } },
            patterns: [{ include: "$self" }]
          },
          { name: "plus", match: "\\+" },
          { name: "minus", match: "(?<![-<>])-(?![-<>])" },
          { name: "times", match: "\\*" },
          { name: "divides", match: "/" },
          { name: "equals", match: "=(?!=*>)" },
          { name: "summation", match: "∑" },
          { name: "product", match: "∏" },
          { name: "integral", match: "∫" },
          {
            name: "sqrt",
            match: "(√)(\\()([^^_(]+?)(\\))",
            captures: {
              1: { name: "sqrt.symbol" },
              2: { name: "hidden" },
              3: { name: "sqrt.content" },
              4: { name: "hidden" }
            }
          },
          { name: "sqrt", match: "√" },
          { name: "binomial", match: "\\b(?:binomial|multinomial)\\([^(]+?\\)" }
        ],
        repository: {},
        scopeName: "math"
      }
    ],
    themes: [
      {
        name: "my-theme",
        // Set background on everything that requires non-color formatting, such as font size.
        // TODO: Can we reliably handle arbitrarily nested exponents and subscripts?.
        settings: [
          { scope: "math", settings: { foreground: "var(--foreground)" } },
          { scope: "hidden", settings: { background: "hidden" } },
          { scope: "anumber", settings: { background: "anumber" } },
          { scope: "author.content", settings: { background: "author.content" } },
          { scope: "bracket", settings: { foreground: "var(--bracket)" } },
          { scope: "exponent.content", settings: { background: "exponent.content" } },
          {
            scope: "exponent.content exponent.content",
            settings: { background: "exponent.content exponent.content" }
          },
          {
            scope: "exponent.content exponent.content exponent.content",
            settings: {
              background: "exponent.content exponent.content exponent.content"
            }
          },
          { scope: "subscript.content", settings: { background: "subscript.content" } },
          {
            scope: "subscript.content subscript.content",
            settings: {
              background: "subscript.content subscript.content"
            }
          },
          {
            scope: "subscript.content subscript.content subscript.content",
            settings: { background: "subscript.content subscript.content subscript.content" }
          },
          { scope: "plus", settings: { foreground: "var(--plus)" } },
          { scope: "minus", settings: { foreground: "var(--minus)" } },
          { scope: "times", settings: { foreground: "var(--times)" } },
          { scope: "divides", settings: { foreground: "var(--divides)" } },
          { scope: "equals", settings: { foreground: "var(--equals)" } },
          { scope: "summation", settings: { foreground: "var(--times)", background: "summation" } },
          { scope: "product", settings: { foreground: "var(--power)", background: "product" } },
          { scope: "integral", settings: { foreground: "var(--times)", background: "integral" } },
          { scope: "sqrt", settings: { foreground: "var(--sqrt)" } },
          { scope: "sqrt.symbol", settings: { background: "sqrt.symbol" } },
          { scope: "sqrt.content", settings: { background: "sqrt.content" } },
          { scope: "floor.begin", settings: { foreground: "var(--floor)", background: "floor.begin" } },
          { scope: "floor.end", settings: { foreground: "var(--floor)", background: "floor.end" } },
          { scope: "floor.content", settings: { background: "floor.content" } },
          { scope: "floor.content floor.content", settings: { background: "floor.content floor.content" } },
          {
            scope: "floor.content floor.content floor.content",
            settings: { background: "floor.content floor.content floor.content" }
          },
          { scope: "ceiling.begin", settings: { foreground: "var(--ceiling)", background: "ceiling.begin" } },
          { scope: "ceiling.end", settings: { foreground: "var(--ceiling)", background: "ceiling.end" } },
          { scope: "ceiling.content", settings: { background: "ceiling.content" } },
          { scope: "ceiling.content ceiling.content", settings: { background: "ceiling.content ceiling.content" } },
          {
            scope: "ceiling.content ceiling.content ceiling.content",
            settings: { background: "ceiling.content ceiling.content ceiling.content" }
          },
          { scope: "binomial", settings: { background: "binomial" } }
        ]
      }
    ],
    engine
  })
})

export async function tokenize(text: string) {
  if (highlighter == null) return []
  const input = text.replaceAll(mathReplacementRegex, (s) => {
    return mathReplacements[s]
  })
  return highlighter.codeToTokensBase(input, {
    lang: "math",
    includeExplanation: "scopeName"
  })
}
