import CursoredBufferElementManager from "./cursoredBufferElementManager";
import { Ascii } from "./util/ascii";
import { Either } from "./util/either";
import { Stream as MashStream } from "./util/stream"

// // Hook up the stdin stream to our UI state and system
// (<any>window).meow = new mash.GithubBlogFilesystem()


function init() {
    let keyboardStream = makeKeyboardInputStream()
    let characterStream = makeCharacterStream(keyboardStream)
    let outputElement = document.getElementById("console_output")!
    let cursorElement = document.getElementById("cursor")!
    let cursorFillerElement = document.getElementById("cursor_text_filler")!

    supportPastedCharactersToStream(characterStream)

    ;(window as any).domAdapter = new CursoredBufferElementManager(
        outputElement,
        cursorElement,
        cursorFillerElement,
        characterStream
    )



    ;(window as any).stdin = characterStream

    document.getElementById("mobile_tricker")?.addEventListener("input", (x) => {
        console.log(x)
        if(
            (x as InputEvent).inputType !== "insertText" && 
            (x as InputEvent).inputType !== "deleteContentBackward" && 
            (x as InputEvent).inputType !== "deleteContentForward"
        ) {
            console.log("going to clear and enter.")
            // The user selected an autocomplete item ; clear what we have so far and replace entire value.
            ;(window as any).stdin.write(Ascii.Codes.ClearScreen)
            ;(window as any).stdin.write(Ascii.stringToCharacterCodes((x.target as HTMLInputElement).value))
        }
    })
}

function readyListener(e: Event) {
    if(document.readyState === 'complete') {
        init();
        ;(window as any).inputCommand = inputCommand
        document.removeEventListener('readystatechange', readyListener)
    }
}

document.addEventListener('readystatechange', readyListener)

let tStart: number | undefined = undefined

document.addEventListener("touchstart", (e) => {
    tStart = new Date().getTime()

    e.preventDefault()
}, false);


document.addEventListener("touchend", (e) => {
    const bottomOfOutput = document.querySelector("#anchor")!.getBoundingClientRect().y - 20;
    const touchY = e.changedTouches.item(e.changedTouches.length - 1)!.clientY
    if(tStart && new Date().getTime() - tStart < 200 && touchY > bottomOfOutput)
    {
        if(document.activeElement == document.getElementById("mobile_tricker")) 
            document.getElementById("mobile_tricker")!.blur()
        else {
            document.getElementById("mobile_tricker")!.focus()
        }
            

        tStart = undefined

        e.preventDefault()
    }
    
})


function inputCommand (command: string) {
    ;(window as any).stdin.write(Ascii.stringToCharacterCodes(`${command}\n`))
}

function makeCharacterStream(keyboardStream: MashStream<string>) {
    let characterStream = new MashStream<number>()

    let helper = <T>(keyValuesEither: Either<T, string[]>) => {
        if(Either.isLeft(keyValuesEither)) {
            alert("ohno")
        } else {
            const keyValues = Either.getValue(keyValuesEither)
            keyValues.forEach((keyValue) => {
                let char = -1
    
                if(keyValue.length == 1) {
                    char = keyValue.charCodeAt(0)
                } else if(keyValue == 'Tab') {
                    char = "\t".charCodeAt(0)
                } else if(keyValue == 'Enter') {
                    // Clear mobile input area
                    (document.querySelector("#mobile_tricker") as HTMLInputElement)!.value = ""
                    char = "\n".charCodeAt(0)
                } else if(keyValue == "ArrowLeft") {
                    char = Ascii.Codes.LeftArrow
                } else if(keyValue == "ArrowRight") {
                    char = Ascii.Codes.RightArrow
                } else if(keyValue == "ArrowDown") {
                    char = Ascii.Codes.DownArrow
                } else if(keyValue == "ArrowUp") {
                    char = Ascii.Codes.UpArrow
                } else if(keyValue == "Backspace") {
                    char = Ascii.Codes.Backspace
                }
    
                if(char != -1) {
                    characterStream.write(char)
                }
            })
            keyboardStream.wait().then(() => helper(keyboardStream.read()))
        }
    }    

    keyboardStream.wait().then(() => helper(keyboardStream.read()))
    
    return characterStream; 
}

function supportPastedCharactersToStream(stream: MashStream<number>) {
    document.addEventListener('paste', function(e)
    {
        let input = e.clipboardData!.getData('text')

        stream.write(Ascii.stringToCharacterCodes(input))
    });
}
function makeKeyboardInputStream() {
    let keyboardStream = new MashStream<string>()

    document.addEventListener('keydown', function(e)
    {
        console.log(e.key)
        console.log(e.ctrlKey)
        if(!e.metaKey) {
            if(e.ctrlKey) {
                if(e.key === 'd') {
                    keyboardStream.write(Ascii.characterCodesToString([Ascii.Codes.EndOfTransmission]))
                }
            }
            keyboardStream.write(e.key) 
        }

        switch(e.key) {
            case "ArrowUp":
            case "ArrowLeft": 
            case "ArrowRight": 
            case "ArrowDown": 
                e.preventDefault()
                break;
        }
    });

    document.addEventListener('keyup', function(e: KeyboardEvent) {
        switch(e.key) {
            case "ArrowUp":
            case "ArrowLeft": 
            case "ArrowRight": 
            case "ArrowDown": 
                e.preventDefault()
                break;
        }
    });

    return keyboardStream
}