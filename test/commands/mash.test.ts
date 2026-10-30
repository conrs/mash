import Mash from "../../src/commands/mash"
import { Stream } from "../../src/util/stream"
import { Ascii } from "../../src/util/ascii"
import { Either } from "../../src/util/either"
import { leakString, Arg } from "../../src/arg/layer"
import { FIXTURE_NEXT, enter, leave, restoreRemote, useFixtureRemote } from "../arg/fixture"

const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

/** Types lines into a real shell and returns the screen. */
async function session(lines: string[]): Promise<string> {
  const stdin = new Stream<number>()
  const stdout = new Stream<number>()
  new Mash().run(stdin, stdout)

  let screen = ""
  for(const line of lines) {
    stdin.write(Ascii.stringToCharacterCodes(line))
    await settle()
    screen += Ascii.characterCodesToString(Either.getValue(stdout.read()) as number[])
  }
  return screen
}

describe("mash", () => {
  beforeEach(() => useFixtureRemote())
  afterEach(() => leave())
  afterAll(() => restoreRemote())

  it("the decode -> next clue flow works from the prompt", async () => {
    const screen = await session([`decode ${leakString()}\n`])
    expect(screen).toContain("mash:/ $ ")
    expect(screen).toContain(Arg.LEAK_PHRASE)
    expect(screen).toContain(FIXTURE_NEXT)
  })

  it("an empty line gives a new prompt instead of leaving the shell", async () => {
    const screen = await session(["\n", "pwd\n"])
    expect(screen).not.toContain("Exiting mash shell")
    expect(screen).toContain("\n/")
  })

  it("ctrl-D still leaves the shell", async () => {
    const screen = await session([String.fromCharCode(Ascii.Codes.EndOfTransmission)])
    expect(screen).toContain("Exiting mash shell")
  })

  it("inside the layer the prompt is damaged and starts at home", async () => {
    enter()
    const screen = await session(["pwd\n"])
    expect(screen).toContain("fixture banner")
    expect(screen).toContain(`<span class="glitch">${Arg.NAME}@`)
    expect(screen).toContain(`/home/${Arg.NAME}`)
  })

  it("control: outside the layer the prompt is the old one", async () => {
    const screen = await session(["pwd\n"])
    expect(screen).not.toContain("glitch")
    expect(screen).not.toContain("fixture banner")
  })
})
