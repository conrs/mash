import { Stream }from "ts-stream"

export type ProgramInput = {
    stdin: Stream<string>,
    stdout: Stream<string>,
    args?: string[]
}

export type Program = (input: ProgramInput) => Promise<number>