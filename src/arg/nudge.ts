// Before the side door opens, the shell is only slightly wrong: now and then the cursor blinks the colour it
// turns once you're inside, and a character flickers to a glyph for a frame or two. Never changes the text.
const GLYPHS = "▓▒░█▚▞"

export function startNudges(output: HTMLElement, cursor: HTMLElement, random: () => number = Math.random): () => void {
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)) }
    const inside = () => document.documentElement.classList.contains("layer")

    // The cursor: one cyan blink every 8 to 30 s.
    const tint = () => {
        if(!inside()) {
            cursor.classList.add("tint")
            later(() => cursor.classList.remove("tint"), 600)
        }
        later(tint, 8000 + random() * 22000)
    }
    later(tint, 6000 + random() * 10000)

    // A character: one jitter every 20 to 60 s, 90-180 ms, then exactly what was there.
    const jitter = () => {
        try {
            if(!reduce && !inside()) {
                const walker = document.createTreeWalker(output, NodeFilter.SHOW_TEXT)
                const nodes: Text[] = []
                for(let n = walker.nextNode(); n; n = walker.nextNode()) {
                    if((n as Text).data.trim().length > 3) nodes.push(n as Text)
                }
                const node = nodes[Math.floor(random() * nodes.length)]
                if(node) {
                    const text = node.data
                    const spots = [...text].map((c, i) => (/\S/.test(c) ? i : -1)).filter((i) => i >= 0)
                    const at = spots[Math.floor(random() * spots.length)]
                    const glyph = GLYPHS[Math.floor(random() * GLYPHS.length)]
                    const altered = text.slice(0, at) + glyph + text.slice(at + 1)
                    node.data = altered
                    later(() => { if(node.data === altered) node.data = text }, 90 + random() * 90)
                }
            }
        } catch(e) {}
        later(jitter, 20000 + random() * 40000)
    }
    later(jitter, 15000 + random() * 20000)

    return () => timers.forEach((t) => clearTimeout(t))
}
