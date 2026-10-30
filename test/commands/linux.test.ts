import { run } from "../helpers"
import { GithubBlogFilesystem } from "../../src/filesystem/githubBlogFs"
import { Pwd } from "../../src/commands/pwd"
import { Whoami } from "../../src/commands/whoami"
import { Echo } from "../../src/commands/echo"
import { Clear } from "../../src/commands/clear"
import { Grep } from "../../src/commands/grep"
import { Pager } from "../../src/commands/pager"
import { Man } from "../../src/commands/man"
import { Ls } from "../../src/commands/ls"
import { Cd } from "../../src/commands/cd"
import { Help } from "../../src/commands/help"
import { HistoryTracker } from "../../src/commands/history"
import { complete } from "../../src/commands/complete"
import { splitPipeline, tokenize } from "../../src/util/tokenize"
import { Ascii } from "../../src/util/ascii"
import { Either } from "../../src/util/either"
import { Layer, Arg } from "../../src/arg/layer"

describe("linux-y commands", () => {
  beforeEach(() => { Layer.active = false })

  it("pwd prints the working directory", async () => {
    const fs = new GithubBlogFilesystem()
    expect((await run(new Pwd(fs))).out).toBe("/")
    fs.pwd = ["blog"]
    expect((await run(new Pwd(fs))).out).toBe("/blog")
  })

  it("whoami is guest outside the layer", async () => {
    expect((await run(new Whoami())).out).toBe("guest")
  })

  it("whoami answers with the redacted name inside the layer", async () => {
    Layer.active = true
    const { out } = await run(new Whoami())
    expect(out).toContain(Arg.NAME)
    expect(out).not.toContain("guest")
  })

  it("echo joins its arguments", async () => {
    expect((await run(new Echo(), ["hello", "world"])).out).toBe("hello world")
  })

  it("clear sends the reset code", async () => {
    expect((await run(new Clear())).out).toBe(String.fromCharCode(Ascii.Codes.StartOfText))
  })

  it("grep filters stdin, with -i and -n", async () => {
    const fs = new GithubBlogFilesystem()
    expect((await run(new Grep(fs), ["bus"], "the bus\nthe tram\nBUS stop")).out).toBe("the bus")
    expect((await run(new Grep(fs), ["-i", "-n", "bus"], "the bus\nthe tram\nBUS stop")).out).toBe("1:the bus\n3:BUS stop")
  })

  it("grep exits 1 with no match, 2 on a missing file", async () => {
    const fs = new GithubBlogFilesystem()
    expect((await run(new Grep(fs), ["zzz"], "abc")).code).toBe(1)
    const missing = await run(new Grep(fs), ["x", "/nope.txt"])
    expect(missing.code).toBe(2)
    expect(missing.out).toContain("No such file or directory")
  })

  it("less passes stdin through and reports a missing file", async () => {
    const fs = new GithubBlogFilesystem()
    expect((await run(new Pager("less", fs), [], "page one")).out).toBe("page one")
    expect((await run(new Pager("more", fs), ["/nope"])).out).toBe("more: /nope: No such file or directory")
  })

  it("man shows a page for a registered command and refuses unknown ones", async () => {
    Help.register(new Pwd(new GithubBlogFilesystem()))
    const page = await run(new Man(), ["pwd"])
    expect(page.out).toContain("NAME\n       pwd - print name of current working directory")
    expect(page.out).toContain("SYNOPSIS")
    expect((await run(new Man(), ["nethack"])).out).toBe("No manual entry for nethack")
  })

  it("ls hides dotfiles unless -a", async () => {
    Layer.active = true
    const fs = new GithubBlogFilesystem()
    const home = "~"
    expect((await run(new Ls(fs), [home])).out).not.toContain(".timer")
    expect((await run(new Ls(fs), ["-a", home])).out).toContain(".timer")
  })

  it("cd with no argument goes home", async () => {
    const fs = new GithubBlogFilesystem()
    fs.pwd = ["blog"]
    await run(new Cd(fs))
    expect(fs.pwd).toEqual([])
  })
})

describe("tokenize", () => {
  it("honours quotes and collapses spaces", () => {
    expect(tokenize(`echo  "a b"   'c|d' e`)).toEqual(["echo", "a b", "c|d", "e"])
    expect(tokenize(`echo ""`)).toEqual(["echo", ""])
  })

  it("splits pipelines outside quotes only", () => {
    expect(splitPipeline(`cat x | grep "a|b"`)).toEqual(["cat x ", ` grep "a|b"`])
  })
})

describe("history", () => {
  it("walks up and back down to an empty line", () => {
    const history = new HistoryTracker()
    history.addLine("ls")
    history.addLine("pwd")

    expect(Either.getValue(history.moveUp())).toBe("pwd")
    expect(Either.getValue(history.moveUp())).toBe("ls")
    expect(Either.isLeft(history.moveUp())).toBe(true)
    expect(Either.getValue(history.moveDown())).toBe("pwd")
    expect(Either.getValue(history.moveDown())).toBe("")
    expect(Either.isLeft(history.moveDown())).toBe(true)
  })

  it("starts from the newest line after a command runs", () => {
    const history = new HistoryTracker()
    history.addLine("ls")
    history.moveUp()
    history.addLine("cat x")
    expect(Either.getValue(history.moveUp())).toBe("cat x")
  })
})

describe("tab completion", () => {
  beforeEach(() => { Layer.active = false })
  const commands = ["cat", "cd", "clear", "ls", "less"]

  it("completes a unique command with a trailing space", async () => {
    expect(await complete("cle", commands, new GithubBlogFilesystem())).toEqual({ insert: "ar ", candidates: ["clear"] })
  })

  it("lists ambiguous commands without inserting", async () => {
    expect(await complete("c", commands, new GithubBlogFilesystem())).toEqual({ insert: "", candidates: ["cat", "cd", "clear"] })
  })

  it("completes directories with a slash", async () => {
    expect((await complete("ls bl", commands, new GithubBlogFilesystem())).insert).toBe("og/")
  })

  it("completes the redacted home only inside the layer", async () => {
    expect((await complete("cd /ho", commands, new GithubBlogFilesystem())).candidates).toEqual([])
    Layer.active = true
    expect((await complete("cd /ho", commands, new GithubBlogFilesystem())).insert).toBe("me/")
    expect((await complete("cd /home/v", commands, new GithubBlogFilesystem())).insert).toBe(Arg.NAME.substring(1) + "/")
  })

  it("keeps dotfiles out until a dot is typed", async () => {
    Layer.active = true
    const fs = new GithubBlogFilesystem()
    expect((await complete("cat ~/.", commands, fs)).insert).toBe("timer ")
    expect((await complete("cat ~/", commands, fs)).candidates).not.toContain(".timer")
  })
})
