/** Splits a command line on `|`, ignoring pipes inside quotes. */
export function splitPipeline(line: string): string[] {
    const segments: string[] = []
    let current = ""
    let quote: string | undefined = undefined

    for(const ch of line) {
        if(quote) {
            if(ch === quote) quote = undefined
        } else if(ch === '"' || ch === "'") {
            quote = ch
        } else if(ch === "|") {
            segments.push(current)
            current = ""
            continue
        }
        current += ch
    }
    segments.push(current)

    return segments
}

/** Splits one command on whitespace, honouring "double" and 'single' quotes. */
export function tokenize(command: string): string[] {
    const tokens: string[] = []
    let current = ""
    let quote: string | undefined = undefined
    let quoted = false

    for(const ch of command) {
        if(quote) {
            if(ch === quote) {
                quote = undefined
            } else {
                current += ch
            }
        } else if(ch === '"' || ch === "'") {
            quote = ch
            quoted = true
        } else if(ch === " " || ch === "\t") {
            if(current !== "" || quoted) tokens.push(current)
            current = ""
            quoted = false
        } else {
            current += ch
        }
    }
    if(current !== "" || quoted) tokens.push(current)

    return tokens
}
