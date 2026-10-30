import { Command } from "./baseCommand";
import { Stream } from "../util/stream";
import { Either } from "../util/either";
import { Help } from "./help";
import { writeText } from "./io";

const PAGES: {[command: string]: [string, string]} = {
  cat: ["cat FILE", "Print FILE. Some files hold lines cat can't show; it prints ^@ where they sit."],
  cd: ["cd [DIR]", "Change the working directory. With no DIR, go home (~)."],
  clear: ["clear", "Clear the screen."],
  decode: ["decode [-b|-r] STRING", "Decode STRING as base64 (-b) or rot13 (-r). Without a flag, guess: base64 if it fits, otherwise rot13. A leading vg:// is ignored."],
  echo: ["echo [STRING...]", "Print the STRINGs, separated by spaces. Quotes group words."],
  edit: ["edit", "Echo everything you type until ctrl-D."],
  grep: ["grep [-i] [-n] PATTERN [FILE]", "Print the lines of FILE (or stdin) containing PATTERN. -i ignores case, -n numbers the lines. Try: cat FILE | grep PATTERN"],
  help: ["help", "List the commands."],
  less: ["less [FILE]", "Show FILE (or stdin). The page scrolls, so there's nothing to page."],
  ls: ["ls [-a] [PATH]", "List a directory. Names starting with a dot are hidden unless you pass -a."],
  man: ["man COMMAND", "Show the manual page for COMMAND. You're reading one."],
  mash: ["mash [NAME]", "Start a nested shell. ctrl-D leaves it."],
  md2html: ["md2html", "Read markdown on stdin and print it as HTML. Try: cat FILE | md2html"],
  more: ["more [FILE]", "Same as less."],
  pwd: ["pwd", "Print the working directory."],
  rotate: ["rotate [N]", "Shift every letter you type by N (default 1) until ctrl-D. rotate 13 is rot13."],
  say: ["say [WORDS...]", "Speak WORDS, or what you type until ctrl-D."],
  strings: ["strings FILE", "Print every run of 4 or more printable characters in FILE, including lines cat hides."],
  whoami: ["whoami", "Print your user name."],
}

export class Man extends Command {
  command: string = "man"
  helpText: string = "an interface to the system reference manuals"
  async run(_: Stream<number>, stdout: Stream<number>, args?: string[]): Promise<number> {
    const name = args && args[0]

    if(!name) {
      writeText(stdout, "What manual page do you want?\nFor example, try 'man man'.")
      return 1
    }

    const commandEither = Help.getCommand(name)
    const page = PAGES[name]

    if(Either.isLeft(commandEither) || !page) {
      writeText(stdout, `No manual entry for ${name}`)
      return 16
    }

    const helpText = Either.getValue(commandEither).helpText
    writeText(stdout, [
      "NAME",
      `       ${name} - ${helpText}`,
      "",
      "SYNOPSIS",
      `       ${page[0]}`,
      "",
      "DESCRIPTION",
      `       ${page[1]}`,
    ].join("\n"))
    return 0
  }
}
