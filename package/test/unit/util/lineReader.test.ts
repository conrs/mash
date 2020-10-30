import { LineReader } from "../../../src/util/lineReader"
import { Stream } from "../../../src/util/stream"
import { Ascii } from "../../../src/util/ascii"

describe("lineReader", () => {
  it("responds with a line of text once it sees NewLine", async () => {
    let stdin = new Stream<number>()
    let lineReader = new LineReader(stdin)
    let line = "This is a line of text"

    let promise = lineReader.readLine()

    stdin.write(Ascii.stringToCharacterCodes(`${line}\n`))

    expect(await promise).toBe(line)
  })

  it("ignores non-text characters", async () => {
    let stdin = new Stream<number>()
    let lineReader = new LineReader(stdin)
    let line = "This is a line of text"

    let promise = lineReader.readLine()

    stdin.write(Ascii.stringToCharacterCodes(line))
    stdin.write(1)
    stdin.write(2)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.NewLine)

    expect(await promise).toBe(line)
  })

  it("handles backspaces as you would expect", async () => {
    let stdin = new Stream<number>()
    let lineReader = new LineReader(stdin)
    let line = "This is a line of text"

    let promise = lineReader.readLine()

    stdin.write(Ascii.stringToCharacterCodes(line))
    stdin.write(Ascii.Codes.Backspace)
    stdin.write(Ascii.Codes.Backspace)
    stdin.write(Ascii.Codes.NewLine)

    expect(await promise).toBe(line.substring(0, line.length - 2))
  })
})