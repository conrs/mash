import { BaseCommand } from "./baseCommand";
import * as util from "../util";
import { Buffer } from "./buffer"
import { LineReader } from "../util/lineReader";

export class Mash extends BaseCommand {
  command = "mash";
  helpText = "shell which interprets commands -- reads until newline unless escaped"
  private commands: {
    [index: string]: BaseCommand
  }

  private commandBuffer: string = ""
  private bufferedStdoutWriter: util.BufferedStreamWriter<number>
  static PROMPT = "mash $"

  constructor(commands: BaseCommand[]) {
    super()
    this.commands = {}

    commands.forEach((command) => this.commands[command.command] = command)
  }

  async run(stdin: util.Stream<number>, stdout: util.Stream<number>, args: string[] = []): Promise<number> {
    let width = args[0] ? args[0] : undefined
    this.bufferedStdoutWriter = new util.BufferedStreamWriter(stdout)
    while(true) {
      this.bufferedStdoutWriter.write(util.Ascii.stringToCharacterCodes("\n" + Mash.PROMPT))
      let bufferStdout = new util.Stream<number>()

      let pipedStdin = util.Stream.pipe(stdin)
      Buffer.run(pipedStdin, bufferStdout, [width])

      let [lineReaderStream, stdoutStream] = util.Stream.split(bufferStdout)

      util.Stream.pipe(stdoutStream, stdout)

      let command = await new LineReader(lineReaderStream).readLine()

      pipedStdin.end()

      await this.execute(command)
    }
  }

  private async execute(command: string) {
    let tokens = command.split(" ")
    console.log(tokens)
    // if(!this.commands[tokens[0]]) {
    //   await this.bufferedStdoutWriter.write(util.Ascii.stringToCharacterCodes(`Command '${tokens[0]}' not found.`))
    // } else {

    // }
  }

}