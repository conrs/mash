import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Either, Right } from "../util/either";
import { Layer, autoDecode, entryHash, entryUrl, isLeakPayload, isLeakPhrase, phraseFragment, Arg } from "../arg/layer";
import { writeText } from "./io";

// Decoded text is pasted from elsewhere; never let it become markup.
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export class Decode extends Command {
  command: string = "decode"
  helpText: string = "decode base64 or rot13 (-b base64, -r rot13, default: guess)"
  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    const flag = (args || []).find((x) => x === "-b" || x === "-r")
    const input = (args || []).filter((x) => x !== flag).join(" ")

    if(input === "") {
      writeText(stdout, "usage: decode [-b|-r] STRING")
      return 1
    }

    const decodedEither = flag !== "-r" && isLeakPayload(input) ?
      Right({ encoding: "base64" as const, text: Arg.LEAK_PHRASE }) :
      autoDecode(input, flag === "-b" ? "base64" : flag === "-r" ? "rot13" : undefined)
    if(Either.isLeft(decodedEither)) {
      writeText(stdout, `decode: ${Either.getValue(decodedEither).message}`)
      return 1
    }

    const decoded = Either.getValue(decodedEither)
    const lines = [escapeHtml(decoded.text)]

    if(isLeakPhrase(decoded.text)) {
      Layer.pulse()
      lines.push(
        `<span class="glitch">░▒▓ handshake accepted ▓▒░</span>`,
        Layer.active ?
          "you are already inside." :
          `a side door opened: <a href="${entryHash()}">${entryUrl()}</a>`
      )
    } else {
      const fragment = phraseFragment(decoded.text)
      if(fragment !== undefined) {
        lines.push(`[fragment ${fragment}/${Arg.LEAK_PHRASE.split(" ").length} recognised. keep listening.]`)
      }
    }

    writeText(stdout, lines.join("\n"))
    return 0
  }
}
