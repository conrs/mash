import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Arg, Layer } from "../arg/layer";
import { writeText } from "./io";

export class Whoami extends Command {
  command: string = "whoami"
  helpText: string = "print effective user name"
  async run(_: Stream<number>, stdout: Stream<number>, __?: string[]): Promise<number> {
    if(Layer.active) {
      Layer.pulse()
      writeText(stdout, `<span class="glitch">${Arg.NAME}</span>\nwhoami: name table corrupted`)
    } else {
      writeText(stdout, "guest")
    }
    return 0
  }
}
