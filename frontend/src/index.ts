import { BrowserCLIWindow } from "./browserCLIWindow";
import * as mash from "conrs-mash"

// Hook up the stdin stream to our UI state and system
(<any>window).meow = new mash.GithubBlogFilesystem()

function init() {
    let keyboardStream = makeKeyboardInputStream()
    let characterStream = makeCharacterStream(keyboardStream)
    let outputElement = document.getElementById("console_output")
    let cursorElement = document.getElementById("cursor")

    writePastedCharactersToStream(characterStream)

    let cliWindow = new BrowserCLIWindow(
        outputElement,
        cursorElement,
        characterStream
    )
}

function readyListener(e: Event) {
    if(document.readyState === 'complete') {
        init();
        document.removeEventListener('readystatechange', readyListener)
    }
}

document.addEventListener('readystatechange', readyListener)

document.addEventListener("touchstart", () => {
    if(document.activeElement == document.getElementById("mobile_tricker"))
      document.getElementById("mobile_tricker").blur()
    else
      document.getElementById("mobile_tricker").focus()
}, false);

function makeCharacterStream(keyboardStream: mash.util.Stream<string>) {
    let characterStream = new mash.util.Stream<number>()

    let helper = (keyValues: string[]) => {
        keyValues.forEach((keyValue) => {
            let char = -1

            if(keyValue.length == 1) {
                char = keyValue.charCodeAt(0)
            } else if(keyValue == 'Tab') {
                char = "\t".charCodeAt(0)
            } else if(keyValue == 'Enter') {
                char = "\n".charCodeAt(0)
            } else if(keyValue == "ArrowLeft") {
                char = mash.util.Ascii.Codes.LeftArrow
            } else if(keyValue == "ArrowRight") {
                char = mash.util.Ascii.Codes.RightArrow
            } else if(keyValue == "ArrowDown") {
                char = mash.util.Ascii.Codes.DownArrow
            } else if(keyValue == "ArrowUp") {
                char = mash.util.Ascii.Codes.UpArrow
            } else if(keyValue == "Backspace") {
                char = mash.util.Ascii.Codes.Backspace
            }

            if(char != -1) {
                characterStream.write(char)
            }
        })
        keyboardStream.wait().then(() => helper(keyboardStream.read()))
    }

    keyboardStream.wait().then(() => helper(keyboardStream.read()))

    return characterStream;
}

function writePastedCharactersToStream(stream: mash.util.Stream<number>) {
    document.addEventListener('paste', function(e)
    {
        let input = e.clipboardData.getData('text')

        stream.write(mash.util.Ascii.stringToCharacterCodes(input))
    });
}
function makeKeyboardInputStream() {
    let keyboardStream = new mash.util.Stream<string>()

    document.addEventListener('keydown', function(e)
    {
        e.preventDefault();
    });

    document.addEventListener('keyup', function(e: KeyboardEvent) {
        keyboardStream.write(e.key)

        e.stopPropagation()
        e.preventDefault();
    });

    return keyboardStream
}