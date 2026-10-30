import { Filesystem, FilesystemDirNode, FilesystemLeafNode } from "../filesystem/core";
import { Ascii } from "../util/ascii";
import { Either, Left, Right } from "../util/either";
import { Stream } from "../util/stream";

export class FileReadError extends Error {}

/** A file's text, or the error message a command should print. `raw` asks for what `strings` sees. */
export async function readFile(filesystem: Filesystem, path: string, raw: boolean = false): Promise<Either<FileReadError, string>> {
    const node = await filesystem.getNodeAtPath(path)

    if(node instanceof FilesystemLeafNode) {
        return Right(await (raw && node.raw ? node.raw() : node.contents()))
    } else if(node instanceof FilesystemDirNode) {
        return Left(new FileReadError(`${path}: Is a directory`))
    }
    return Left(new FileReadError(`${path}: No such file or directory`))
}

/** Everything on stdin up to end of transmission (ctrl-D, or the end of the previous command in a pipe). */
export async function readAll(stdin: Stream<number>): Promise<string> {
    let characters: number[] = []

    await stdin.consume((chunk) => {
        const end = chunk.indexOf(Ascii.Codes.EndOfTransmission)
        characters = characters.concat(end === -1 ? chunk : chunk.slice(0, end))
        return end === -1
    })

    return Ascii.characterCodesToString(characters)
}

export function writeText(stdout: Stream<number>, text: string) {
    stdout.write(Ascii.stringToCharacterCodes(text))
}
