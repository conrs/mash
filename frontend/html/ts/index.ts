import { Program, ProgramInput } from "./models/types.js";
import Stream from "./stream.js"
import { Ascii } from "./ascii.js";
import { CLIWindow } from "./cliWindow.js";


// Hook up the stdin stream to our UI state and system

function init() {
    let keyboardStream = makeKeyboardInputStream()
    let characterStream = makeCharacterStream(keyboardStream)

    let window = new CLIWindow(
        characterStream,
        (output) => console.log(output),
        (x: number, y: number, visible: boolean) => console.log(`Cursor ${visible ? "(visible)" : "(invisible)"} x: ${x} y: ${y}`),
        20
    )
}

function readyListener(e: Event) {
    if(document.readyState === 'complete') {
        init();
        document.removeEventListener('readystatechange', readyListener)
    }
}

document.addEventListener('readystatechange', readyListener)

function makeCharacterStream(keyboardStream: Stream<string>) {
    let characterStream = new Stream<number>()

    let helper = (keyValue: string) => {
        let char = -1
            
        if(keyValue.length == 1) {
            char = keyValue.charCodeAt(0)
        } else if(keyValue == 'Tab') {
            char = "\t".charCodeAt(0) 
        } else if(keyValue == 'Enter') {
            char = "\n".charCodeAt(0)
        } else if(keyValue == "ArrowLeft") {
            char = Ascii.Codes.LeftArrow
        } else if(keyValue == "ArrowRight") {
            char = Ascii.Codes.RightArrow
        }

        if(char != -1) {
            characterStream.write(char)
        }

        // Listen for the next input
        keyboardStream.read().then(helper)
    }

    keyboardStream.read().then(helper)

    return characterStream;
}

function makeKeyboardInputStream() {
    let keyboardStream = new Stream<string>()
    
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