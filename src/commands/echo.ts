import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { writeText } from "./io";

export class Echo extends Command {
  command: string = "echo"
  helpText: string = "display a line of text"
  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    writeText(stdout, (args || []).join(" "))
    return 0
  }
}
