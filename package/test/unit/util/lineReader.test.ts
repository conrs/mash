import { LineReader } from "../../../src/util/lineReader"
import { Stream } from "../../../src/util/stream"
import { Ascii } from "../../../src/util/ascii"

describe("lineReader", () => {
  it("responds with a line of text once it sees NewLine", async () => {
    let stdin = new Stream<number>()
    let lineReader = new LineReader(stdin)
    let line = "This is a line of text"

    let promise = lineReader.readLine()

    Stream.writeString(stdin, `${line}\n`)

    expect(await promise).toBe(line)
  })

  it("doesn't get confused if output gets cleared", async () => {
    let stdin = new Stream<number>()
    let lineReader = new LineReader(stdin)
    let line1 = "This is a line of text"
    let line2 = "I hope this one happens"

    let promise = lineReader.readLine()

    Stream.writeString(stdin, line1)
    stdin.write(Ascii.Codes.ClearScreen)
    Stream.writeString(stdin, `${line2}\n`)
    expect(await promise).toBe(line2)
  })

  it("ignores non-text characters", async () => {
    let stdin = new Stream<number>()
    let lineReader = new LineReader(stdin)
    let line = "This is a line of text"

    let promise = lineReader.readLine()

    Stream.writeString(stdin, line)
    stdin.write(1)
    stdin.write(2)
    stdin.write(Ascii.Codes.LeftArrow)
    stdin.write(Ascii.Codes.NewLine)

    expect(await promise).toBe(line)
  })
})