/**
 * The hidden "damaged AI" layer of the shell (an ARG prop). Everything here is fiction:
 * no real system access, no real files.
 *
 * This repo is public, so it holds only the engine. What comes after the teaser's phrase, the side
 * door and everything behind it are fetched from the waitlist Worker at runtime.
 */
import { Either, Left, Right } from "../util/either"

export const Arg = {
    // The phrase the teasers leak, as `vg://` + base64 of it.
    LEAK_PHRASE: "THE CITY IS LISTENING",
    API: "https://invite.matt-d11.workers.dev/v1/arg",
    NAME: "v█████",
}

export const GLITCH_GLYPHS = ["░", "▒", "▓", "█"]

export const leakString = () => `vg://${btoa(Arg.LEAK_PHRASE)}`
export const doorHash = (token: string) => `#k=${token}`

/** A home-directory tree: a file is its lines, a directory an object. */
export type HomeTree = { [name: string]: string[] | HomeTree }

export type DoorContent = {
    banner: string[],
    home: HomeTree,
    drops: string[][],
    timer: { total: number, delivered: number, nextAt: string | null },
}
export type KnockAnswer = { ok: boolean, lines?: string[], door?: string }
export type DoorAnswer = { ok: boolean, note?: string } & Partial<DoorContent>

export type ArgRemote = {
    knock(text: string): Promise<KnockAnswer>,
    door(token: string): Promise<DoorAnswer>,
}

async function getJson<T>(path: string): Promise<T> {
    const res = await fetch(Arg.API + path, { cache: "no-store" })
    if(!res.ok) {
        throw new Error(`arg: ${res.status}`)
    }
    return await res.json() as T
}

export const workerRemote: ArgRemote = {
    knock: (text) => getJson(`/knock?p=${encodeURIComponent(text)}`),
    door: (token) => getJson(`/door?k=${encodeURIComponent(token)}`),
}

const TOKEN_HASH = /^#k=([A-Za-z0-9_-]{1,64})$/

export const Layer = {
    content: undefined as DoorContent | undefined,
    // A line a closed door answers with, shown once at boot.
    note: undefined as string | undefined,
    remote: workerRemote,
    now: (): Date => new Date(),
    random: (): number => Math.random(),
    // index.ts swaps in the real red flicker.
    pulse: (): void => {},

    get active(): boolean {
        return this.content !== undefined
    },

    isDoorHash(hash: string): boolean {
        return TOKEN_HASH.test(hash)
    },

    /** Asks the Worker whether con.rs/#k=<token> opens anything. Never throws. */
    async openFromHash(hash: string): Promise<void> {
        this.content = undefined
        this.note = undefined
        const match = hash.match(TOKEN_HASH)
        if(!match) {
            return
        }
        try {
            const answer = await this.remote.door(match[1])
            if(answer.ok && answer.home && answer.banner && answer.drops && answer.timer) {
                this.content = { banner: answer.banner, home: answer.home, drops: answer.drops, timer: answer.timer }
            } else if(typeof answer.note === "string") {
                this.note = answer.note
            }
        } catch(e) {
            this.note = "side door: no answer. (try again later.)"
        }
    },
}

export function corrupt(text: string, count: number = 2): string {
    const chars = text.split("")
    for(let i = 0; i < count; i++) {
        const at = Math.floor(Layer.random() * chars.length)
        chars[at] = GLITCH_GLYPHS[Math.floor(Layer.random() * GLITCH_GLYPHS.length)]
    }
    return chars.join("")
}

export class DecodeError extends Error {}

export function rot13(text: string): string {
    return text.replace(/[a-z]/gi, (c) => {
        const base = c <= "Z" ? 65 : 97
        return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base)
    })
}

/** Strips the `vg://` scheme and anything up to a `?` (e.g. `vg://k7?<payload>`). */
export function stripScheme(text: string): string {
    if(!text.startsWith("vg://")) {
        return text
    }
    const rest = text.substring(5)
    return rest.substring(rest.lastIndexOf("?") + 1)
}

export function decodeBase64(text: string): Either<DecodeError, string> {
    const normalized = text.replace(/-/g, "+").replace(/_/g, "/")
    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized) || normalized.replace(/=+$/, "").length % 4 === 1) {
        return Left(new DecodeError("not base64"))
    }
    try {
        const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))
        if(decoded.length === 0 || !/^[\x20-\x7e\n\t]+$/.test(decoded)) {
            return Left(new DecodeError("base64 decoded to binary"))
        }
        return Right(decoded)
    } catch(e) {
        return Left(new DecodeError("not base64"))
    }
}

/**
 * The leaked string is retyped by hand from a video, where l/1/I and O/0 look alike, so
 * compare it to the real payload with lookalikes folded together (and padding, quotes,
 * whitespace and URL-encoding ignored). True only for the leak, never for other input.
 */
export function isLeakPayload(input: string): boolean {
    let text = input.trim().replace(/^["'`\u2018\u2019\u201c\u201d]+|["'`\u2018\u2019\u201c\u201d]+$/g, "").trim()
    try {
        text = decodeURIComponent(text)
    } catch(e) {}
    text = text.trim()
    if(/^vg:\/\//i.test(text)) {
        text = stripScheme("vg://" + text.substring(5))
    }
    const fold = (s: string) => s
        .replace(/=+$/, "")
        .replace(/-/g, "+").replace(/_/g, "/")
        .replace(/[1lI|]/g, "1")
        .replace(/[0Oo]/g, "0")
    return text !== "" && fold(text) === fold(btoa(Arg.LEAK_PHRASE))
}

export type Decoded = { encoding: "base64" | "rot13", text: string }

export function autoDecode(input: string, force?: "base64" | "rot13"): Either<DecodeError, Decoded> {
    const payload = stripScheme(input.trim())

    if(force !== "rot13") {
        const base64Either = decodeBase64(payload)
        if(Either.isRight(base64Either)) {
            return Right({ encoding: "base64", text: Either.getValue(base64Either) })
        } else if(force === "base64") {
            return base64Either
        }
    }

    return Right({ encoding: "rot13", text: rot13(payload) })
}

const normalizePhrase = (text: string) => text.trim().toUpperCase().replace(/\s+/g, " ")

export function isLeakPhrase(text: string): boolean {
    return normalizePhrase(text) === normalizePhrase(Arg.LEAK_PHRASE)
}

/** 1-based position of a single word of the phrase, for people who found only one leak. */
export function phraseFragment(text: string): number | undefined {
    const words = normalizePhrase(Arg.LEAK_PHRASE).split(" ")
    const index = words.indexOf(normalizePhrase(text))
    return index === -1 || normalizePhrase(text).includes(" ") ? undefined : index + 1
}

/** Only words go to the Worker: whatever else people decode stays in their browser. */
export function isPhraseShaped(text: string): boolean {
    const phrase = normalizePhrase(text)
    return phrase.length <= 120 && /^[A-Z]+( [A-Z]+){1,11}$/.test(phrase)
}
