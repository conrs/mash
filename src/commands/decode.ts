import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Either, Right } from "../util/either";
import { Layer, autoDecode, doorHash, isLeakPayload, isLeakPhrase, isPhraseShaped, phraseFragment, Arg, KnockAnswer } from "../arg/layer";
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
    const leak = isLeakPhrase(decoded.text)

    if(leak) {
      Layer.pulse()
      lines.push(`<span class="glitch">░▒▓ handshake accepted ▓▒░</span>`)
    } else {
      const fragment = phraseFragment(decoded.text)
      if(fragment !== undefined) {
        lines.push(`[fragment ${fragment}/${Arg.LEAK_PHRASE.split(" ").length} recognised. keep listening.]`)
      }
    }

    if(isPhraseShaped(decoded.text)) {
      let answer: KnockAnswer | undefined
      try {
        answer = await Layer.remote.knock(decoded.text)
      } catch(e) {}

      if(answer === undefined) {
        if(leak) lines.push("the line went quiet. try again later.")
      } else if(answer.ok) {
        if(!leak) Layer.pulse()
        lines.push(...(answer.lines || []).map(escapeHtml))
        if(answer.door) {
          const hash = escapeHtml(doorHash(answer.door))
          lines.push(Layer.active ?
            "you are already inside." :
            `a side door opened: <a href="${hash}">con.rs/${hash}</a>`)
        }
      }
    }

    writeText(stdout, lines.join("\n"))
    return 0
  }
}
