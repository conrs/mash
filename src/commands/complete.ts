import { Filesystem, FilesystemDirNode } from "../filesystem/core";

export type Completion = {
    // Text to append at the cursor (may be empty).
    insert: string
    // Every match, for listing when the completion is ambiguous.
    candidates: string[]
}

const commonPrefix = (words: string[]) => words.reduce((prefix, word) => {
    let i = 0
    while(i < prefix.length && i < word.length && prefix[i] === word[i]) i++
    return prefix.substring(0, i)
})

/**
 * Tab completion: the first word completes against commands, later words against paths
 * (relative or absolute, `~` included). Dotfiles only complete once you type the dot.
 */
export async function complete(line: string, commands: string[], filesystem: Filesystem): Promise<Completion> {
    const words = line.split(" ")
    const word = words[words.length - 1]

    let candidates: string[] = []
    let typed = word
    let finished = (match: string) => match + " "

    if(words.length === 1) {
        candidates = commands.filter((command) => command.startsWith(word)).sort()
    } else {
        const slash = word.lastIndexOf("/")
        const dirPart = word.substring(0, slash + 1)
        typed = word.substring(slash + 1)

        const dir = await filesystem.getNodeAtPath(dirPart === "" ? "." : dirPart)
        if(dir instanceof FilesystemDirNode) {
            const children = await dir.children()
            candidates = Object.keys(children)
                .filter((name) => name.startsWith(typed) && (typed.startsWith(".") || !name.startsWith(".")))
                .map((name) => children[name] instanceof FilesystemDirNode ? name + "/" : name)
                .sort()
        }
        finished = (match: string) => match.endsWith("/") ? match : match + " "
    }

    if(candidates.length === 0) {
        return { insert: "", candidates }
    }

    const prefix = candidates.length === 1 ? finished(candidates[0]) : commonPrefix(candidates)

    return { insert: prefix.substring(typed.length), candidates }
}
