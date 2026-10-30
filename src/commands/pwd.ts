import { Command } from "./baseCommand";
import { Filesystem } from "../filesystem/core";
import { Stream } from "../util/stream";
import { writeText } from "./io";

export class Pwd extends Command {
  command: string = "pwd"
  helpText: string = "print name of current working directory"
  async run(_: Stream<number>, stdout: Stream<number>, __?: string[]): Promise<number> {
    writeText(stdout, "/" + this.filesystem.pwd.join("/"))
    return 0
  }

  constructor(
    private filesystem: Filesystem) {
      super()
  }
}
