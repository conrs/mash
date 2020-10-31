import { BaseCommand } from "./baseCommand";
import * as util from "../util";
import { Buffer } from "./buffer/buffer";
import { GithubBlogFilesystem } from "../filesystem/githubBlogFs";
import { Ls } from "./ls";
import { Cat } from "./cat";
import { Cd } from "./cd";
import { fold } from "../util/fold";
import { Echo } from "./echo";
import { Rotate } from "./rotate";

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
    "cd": new Cd(this.filesystem),
    "echo": new Echo(),
    "rotate": new Rotate()
  }

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


  private async execute(string: string) {
    type meow = {run: () => Promise<any>, stream: util.Stream<number>}

    try {
      let result = fold(string.split("|"), {stream: this.stdin, run: () => Promise.resolve()} as meow, (acc, command) => {
        let tokens = command.split(" ").filter((x) => x != "")

        let cmd = this.commands[tokens[0]]
        let args = tokens.slice(1)
        let stream = new util.Stream<number>()

        if(!cmd) {
          throw new CommandNotFoundError(tokens[0])
        }

        return {
          run: async () => acc.run().then(async ()=> {
             await cmd.run(acc.stream, stream, args)
             stream.write(util.Ascii.Codes.EndOfTransmission)
          }),
          stream: stream
        }
      })

      result.stream.pipe(this.bufferStdin)

      await result.run()
      this.bufferStdin.write(util.Ascii.Codes.NewLine)
    } catch(e) {
      if(e instanceof CommandNotFoundError) {
        this.bufferStdin.write(util.Ascii.stringToCharacterCodes(e.message))
      } else {
        throw e
      }
    }
  }
}

class CommandNotFoundError extends Error {
  constructor(command: string) {
    super()
    this.message = `Command '${command}' not found.\n`
  }
}