import { Command } from "./baseCommand";
import * as util from "../util";
import { Buffer } from "./buffer/buffer";
import { GithubBlogFilesystem } from "../filesystem/githubBlogFs";
import { Ls } from "./ls";
import { Cat } from "./cat";
import { Cd } from "./cd";
import { fold } from "../util/fold";
import { Echo } from "./echo";
import { Rotate } from "./rotate";
import { commands } from "..";

export class Mash extends Command {
  command = "mash";
  helpText = "shell which interprets commands"

  private filesystem: GithubBlogFilesystem = new GithubBlogFilesystem()

  private stdin: util.Stream<number>
  private bufferStdin: util.Stream<number>

  private shouldInterceptStdin: boolean = false

  private historyTracker: HistoryTracker = new HistoryTracker()

  prompt = () => `mash:/${this.filesystem.pwd.join("/")} $ `

  commands: {
    [index: string]: Command
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

    let [ourStdin, stdinToIntercept] = stdin.split()

    stdinToIntercept.consume((data) => {
      data.forEach((character) => {
        let historyLine: string;

        if(util.Ascii.Codes.UpArrow == character) {
          historyLine = this.historyTracker.moveUp()
        } if(util.Ascii.Codes.DownArrow == character) {
          // let history go back to blank
          historyLine = this.historyTracker.moveDown()
        }

        if(historyLine !== undefined) {
          this.bufferStdin.write(util.Ascii.Codes.ClearScreen)
          this.bufferStdin.write(util.Ascii.stringToCharacterCodes(historyLine))
        } else {
          this.bufferStdin.write(character)
        }
      })
    })

    let bufferStdin = new util.Stream<number>()

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
      this.shouldInterceptStdin = true

      await ourBufferStream.flush()
      let line = await new util.LineReader(ourBufferStream).readLine()
      this.shouldInterceptStdin = false

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

    this.historyTracker.addLine(string)

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

class HistoryTracker {
  private commandHistory: string[] = []
  private currentIndex: number = 0

  moveUp(): string {
    if(this.currentIndex > 0) {
      this.currentIndex--;

      return this.commandHistory[this.currentIndex]
    }
  }

  moveDown(): string {
    if(this.currentIndex < this.commandHistory.length) {
      this.currentIndex++;
    }

    return this.currentIndex == this.commandHistory.length ? "" : this.commandHistory[this.currentIndex]
  }

  addLine(line: string) {
    if(line != "") {
      this.commandHistory[this.commandHistory.length] = line
      this.currentIndex = this.commandHistory.length
    }
  }
}