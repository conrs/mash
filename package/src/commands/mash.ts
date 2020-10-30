import { BaseCommand } from "./baseCommand";
import * as util from "../util";
<<<<<<< HEAD
import { Buffer } from "./buffer/buffer";
import { GithubBlogFilesystem } from "../filesystem/githubBlogFs";
import { Ls } from "./ls";
import { Cat } from "./cat";
import { Cd } from "./cd";

export class Mash extends BaseCommand {
  command = "mash";
  helpText = "shell which interprets commands"

  private filesystem: GithubBlogFilesystem = new GithubBlogFilesystem()

  private stdin: util.Stream<number>
  private bufferStdin: util.Stream<number>

  prompt = () => `mash:/${this.filesystem.pwd.join("/")} $ `

  commands: {
    [index: string]: BaseCommand
  } = {
    "ls": new Ls(this.filesystem),
    "cat": new Cat(this.filesystem),
    "cd": new Cd(this.filesystem)
  }
=======
import { MattsTechDebtTextContainer } from "./mattsTechDebtTextContainer"
import { LineReader } from "../util/lineReader";
import { SingleLineBuffer } from "./singleLineBuffer";

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
>>>>>>> master

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
    let maxWidth = args[0] ? parseInt(args[0], 10) : Number.MAX_SAFE_INTEGER
    let initialText  = args[1] ? args[1] : ""
    let bufferOutput = new util.Stream<number>()

    let [ourStdin, bufferStdin] = stdin.split()

    new Buffer().run(bufferStdin, bufferOutput, [maxWidth.toString()])

    this.stdin = ourStdin
    this.bufferStdin = bufferStdin
    let [bufferToStdout, ourBufferStream] = bufferOutput.split()

    bufferToStdout.consume((characters) => {
      stdout.write(characters)
    })

    bufferStdin.write(util.Ascii.stringToCharacterCodes(initialText))

    while(true) {
      bufferStdin.write(util.Ascii.stringToCharacterCodes(this.prompt()))
      bufferStdin.write(util.Ascii.Codes.StartOfText)

      await ourBufferStream.flush()
      let line = await new util.LineReader(ourBufferStream).readLine()
      bufferStdin.write(util.Ascii.Codes.StartOfText)
      // Patch up stdout cursor position since buffer doesn't know bout prompt
      stdout.write(
        [...Array(this.prompt().length).keys()].map(() => util.Ascii.Codes.LeftArrow)
      )

      await this.execute(line)
    }
  }

  private async execute(command: string) {
<<<<<<< HEAD
    const tokens = command.split(" ")
    const cmd = this.commands[tokens[0]]
    if(cmd) {
      await cmd.run(this.stdin, this.bufferStdin, tokens.slice(1))
      this.bufferStdin.write(util.Ascii.Codes.NewLine)
    } else {
      this.bufferStdin.write(util.Ascii.stringToCharacterCodes(`Command '${tokens[0]}' not found.\n`))
    }
=======
    await this.stdoutWriter.write(util.Ascii.stringToCharacterCodes(`I wanted to run '${command}'\n`))
    // if(!this.commands[tokens[0]]) {
    //   await this.bufferedStdoutWriter.write(util.Ascii.stringToCharacterCodes(`Command '${tokens[0]}' not found.`))
    // } else {

    // }
>>>>>>> master
  }

}