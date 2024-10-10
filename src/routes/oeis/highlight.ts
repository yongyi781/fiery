import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from "shiki"

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
  "<>": "≠"
}

const mathReplacementRegex = new RegExp(
  Object.keys(mathReplacements)
    .map((key) => (key[key.length - 1] == "=" ? key : `\\b${key}(\\b|(?=_))`))
    .join("|"),
  "g"
)

let highlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | undefined

export async function tokenize(text: string) {
  if (highlighter == null) {
    highlighter = await createHighlighter({
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
              match: "(?<=[\\s\\[]+|^)(_)(.+?)(_)",
              captures: { 1: { name: "hidden" }, 2: { name: "author.content" }, 3: { name: "hidden" } }
            },
            {
              name: "exponent.parentheses",
              contentName: "exponent.content",
              begin: "(\\^\\()",
              end: "(\\))",
              captures: { 1: { name: "hidden" } },
              patterns: [{ include: "$self" }]
            },
            {
              name: "exponent.braces",
              contentName: "exponent.content",
              begin: "(\\^{)",
              end: "(})",
              captures: { 1: { name: "hidden" } },
              patterns: [{ include: "$self" }]
            },
            {
              name: "exponent",
              contentName: "exponent.content",
              begin: "(\\^)",
              end: "$|(?=[^a-zA-Z0-9^(])|(?<![a-zA-Z])(?=\\()",
              beginCaptures: { 1: { name: "hidden" } },
              patterns: [{ include: "$self" }]
            },
            {
              name: "subscript.parentheses",
              contentName: "subscript.content",
              begin: "(\\_\\()",
              end: "(\\))",
              captures: { 1: { name: "hidden" } },
              patterns: [{ include: "$self" }]
            },
            {
              name: "subscript.braces",
              contentName: "subscript.content",
              begin: "(\\_{)",
              end: "(})",
              captures: { 1: { name: "hidden" } },
              patterns: [{ include: "$self" }]
            },
            {
              name: "subscript",
              contentName: "subscript.content",
              begin: "(\\_)",
              end: "$|(?=[^a-zA-Z0-9_])|\\)",
              captures: { 1: { name: "hidden" } },
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
              name: "sqrt.constant",
              match: "(√)(\\()([^(]+?)(\\))",
              captures: {
                1: { name: "sqrt.constant.symbol" },
                2: { name: "hidden" },
                3: { name: "sqrt.constant.content" },
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
            { scope: "sqrt.constant.symbol", settings: { background: "sqrt.constant.symbol" } },
            { scope: "sqrt.constant.content", settings: { background: "sqrt.constant.content" } },
            { scope: "binomial", settings: { background: "binomial" } }
          ]
        }
      ]
    })
  }
  const input = text.replaceAll(mathReplacementRegex, (s) => {
    return mathReplacements[s]
  })
  return highlighter.codeToTokensBase(input, {
    lang: "math" as BundledLanguage,
    includeExplanation: "scopeName"
  })
}
