import { BaseCommand } from "./baseCommand";
import * as util from "../util";
import { Buffer } from "./buffer"
import { LineReader } from "../util/lineReader";

export class Mash extends BaseCommand {
  command = "mash";
  helpText = "shell which interprets commands -- reads until newline unless escaped"
  static commands: {
    [index: string]: BaseCommand
  }
  static PROMPT = "mash $ "

  private stdin: util.Stream<number>
  private stdout: util.Stream<number>
  private stdoutWriter: util.BufferedStreamWriter<number>
  private cursorY: number; // Needed to ensure cursor never

  /**
   * Responsibilities:
   * - Printing prompt
   * - Managing cursor to accomodate prompt
   * - Reading lines and executing commands
   *
   * Could subdivide but I am lazy.
   * @param stdin
   * @param stdout
   * @param args
   */
  async run(stdin: util.Stream<number>, stdout: util.Stream<number>, args: string[] = []): Promise<number> {
    let width = args[0] ? args[0] : undefined

    this.stdout = stdout;
    this.stdin = stdin;
    this.stdoutWriter = new util.BufferedStreamWriter(stdout)

    while(true) {
      let bufferStdin = util.Stream.pipe(this.stdin)

      this.stdoutWriter.write(util.Ascii.stringToCharacterCodes(Mash.PROMPT))

      let bufferStdout = new util.Stream<number>()

      Buffer.run(bufferStdin, bufferStdout, [width])

      let [lineReaderStream, stdoutStream] = util.Stream.split(bufferStdout)

      // We write buffer's output directly to stdout, but we also read it to see when a line is entered (to run the command).

      util.Stream.pipe(stdoutStream, stdout)

      let command = await new LineReader(lineReaderStream).readLine()

      await this.execute(command)
      bufferStdin.end()
      bufferStdout.end()
    }
  }

  private async execute(command: string) {
    await this.stdoutWriter.write(util.Ascii.stringToCharacterCodes(`I wanted to run '${command}'\n`))
    // if(!this.commands[tokens[0]]) {
    //   await this.bufferedStdoutWriter.write(util.Ascii.stringToCharacterCodes(`Command '${tokens[0]}' not found.`))
    // } else {

    // }
  }

}