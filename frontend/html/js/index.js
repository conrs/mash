import Stream from "./stream.js";
import { Ascii } from "./ascii.js";
import { CLIWindow } from "./cliWindow.js";
function init() {
    let keyboardStream = makeKeyboardInputStream();
    let characterStream = makeCharacterStream(keyboardStream);
    let window = new CLIWindow(characterStream, (output) => console.log(output), (x, y, visible) => console.log(`Cursor ${visible ? "(visible)" : "(invisible)"} x: ${x} y: ${y}`), 20);
}
function readyListener(e) {
    if (document.readyState === 'complete') {
        init();
        document.removeEventListener('readystatechange', readyListener);
    }
}
document.addEventListener('readystatechange', readyListener);
function makeCharacterStream(keyboardStream) {
    let characterStream = new Stream();
    let helper = (keyValue) => {
        let char = -1;
        if (keyValue.length == 1) {
            char = keyValue.charCodeAt(0);
        }
        else if (keyValue == 'Tab') {
            char = "\t".charCodeAt(0);
        }
        else if (keyValue == 'Enter') {
            char = "\n".charCodeAt(0);
        }
        else if (keyValue == "ArrowLeft") {
            char = Ascii.Codes.LeftArrow;
        }
        else if (keyValue == "ArrowRight") {
            char = Ascii.Codes.RightArrow;
        }
        if (char != -1) {
            characterStream.write(char);
        }
        keyboardStream.read().then(helper);
    };
    keyboardStream.read().then(helper);
    return characterStream;
}
function makeKeyboardInputStream() {
    let keyboardStream = new Stream();
    document.addEventListener('keydown', function (e) {
        if (e.keyCode == 9) {
            e.preventDefault();
        }
    });
    document.addEventListener('keyup', function (e) {
        keyboardStream.write(e.key);
        e.stopPropagation();
        e.preventDefault();
    });
    return keyboardStream;
}
//# sourceMappingURL=index.js.map