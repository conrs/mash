/**
 * The hidden "damaged AI" layer of the shell (an ARG prop). Everything here is fiction:
 * no real system access, no real files, nothing fetched.
 *
 * Change the knobs in Arg; nothing else hard-codes them.
 */
import { Either, Left, Right } from "../util/either"

export const Arg = {
    // The phrase the teasers leak, as `vg://` + base64 of it.
    LEAK_PHRASE: "THE CITY IS LISTENING",
    // The side door: con.rs/#k=<ENTRY_TOKEN>
    ENTRY_TOKEN: "listening",
    WAITLIST_URL: "https://invite.matt-d11.workers.dev/?from=arg",
    // The day the console goes live (set it to the push date). Drop 1 unlocks here,
    // then one more every 24h. UTC; 16:00Z is 9am Pacific.
    UNLOCK_START: "2026-10-30T16:00:00Z",
    NAME: "v█████",
}

export const GLITCH_GLYPHS = ["░", "▒", "▓", "█"]

export const entryHash = () => `#k=${Arg.ENTRY_TOKEN}`
export const entryUrl = () => `con.rs/${entryHash()}`
export const leakString = () => `vg://${btoa(Arg.LEAK_PHRASE)}`

export const Layer = {
    active: false,
    now: (): Date => new Date(),
    random: (): number => Math.random(),
    // index.ts swaps in the real red flicker.
    pulse: (): void => {},

    syncFromHash(hash: string) {
        this.active = hash === entryHash()
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

export const DROP_COUNT = 7
const DAY_MS = 24 * 60 * 60 * 1000

export function dropUnlockTime(dropNumber: number): Date {
    return new Date(new Date(Arg.UNLOCK_START).getTime() + (dropNumber - 1) * DAY_MS)
}

export function unlockedDropCount(now: Date = Layer.now()): number {
    const elapsed = now.getTime() - new Date(Arg.UNLOCK_START).getTime()
    if(elapsed < 0) {
        return 0
    }
    return Math.min(DROP_COUNT, Math.floor(elapsed / DAY_MS) + 1)
}
