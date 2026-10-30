// tsconfig's types leave out node.
declare const require: (name: string) => any
declare const __dirname: string
const { readFileSync } = require("fs")
const { join } = require("path")

// jest has no layout; test/browser/wrap-check.mjs is the real check. This pins the rules it depends on.
const css = readFileSync(join(__dirname, "../public/style.css"), "utf8")
const rule = (selector: string) => {
  const start = css.indexOf(`\n${selector} {`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf("}", start))
}

describe("cursor and text wrap at the same place", () => {
  it.each(["#console_output", "#cursor_text_filler"])("%s keeps spaces at the wrap and breaks long words", (selector) => {
    expect(rule(selector)).toContain("white-space: break-spaces")
    expect(rule(selector)).toContain("overflow-wrap: anywhere")
  })

  it("the filler's container is as wide as the output", () => {
    expect(rule("#cursor_container")).toContain("width: 95vw")
    expect(rule("#console_output")).toContain("width: 95vw")
  })
})
