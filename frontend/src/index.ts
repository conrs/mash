import { BrowserCLIWindow } from "./browserCLIWindow";
import * as mash from "conrs-mash"

// Hook up the stdin stream to our UI state and system

function init() {
    let keyboardStream = makeKeyboardInputStream()
    let characterStream = makeCharacterStream(keyboardStream)

    let outputElement = document.getElementById("console_output")
    let cursorElement = document.getElementById("cursor")
    let window = new BrowserCLIWindow(
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

function makeCharacterStream(keyboardStream: mash.util.Stream<string>) {
    let characterStream = new mash.util.Stream<number>()

    let helper = (keyValue: string) => {
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
        }

        if(char != -1) {
            console.log("writin", char)
            characterStream.write(char)
        }

        // Listen for the next input
        keyboardStream.read().then(helper)
    }

    keyboardStream.read().then(helper)

    return characterStream;
}

function makeKeyboardInputStream() {
    let keyboardStream = new mash.util.Stream<string>()
    
    document.addEventListener('keydown', function(e)
    {
        if(e.keyCode == 9)
        {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', function(e: KeyboardEvent) {
        keyboardStream.write(e.key)
        
        e.stopPropagation()
        e.preventDefault();
    });
   
    return keyboardStream
}