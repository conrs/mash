import Stream from "./stream.js";
import { Ascii } from "./ascii.js";
class CursorPositionHandler {
    constructor(maxWidth) {
        this.maxWidth = maxWidth;
        this.xOffset = 0;
        this.yOffset = 0;
        this.x = 0;
        this.y = 0;
    }
    getX() {
        return this.x + this.xOffset;
    }
    getY() {
        return this.y + this.yOffset;
    }
    resize(newWidth, buffer) {
        this.constructor(newWidth);
        this.accountFor(buffer);
    }
    moveLeft() {
        if (this.x + this.xOffset > 0) {
            this.xOffset--;
            return true;
        }
        else {
            return false;
        }
    }
    moveRight() {
        if (this.xOffset < 0) {
            this.xOffset++;
            return true;
        }
        else {
            return false;
        }
    }
    accountFor(value) {
        this.xOffset = 0;
        this.yOffset = 0;
        for (let i = 0; i < value.length; i++) {
            if (value.charAt(i) == "\n") {
                this.newLine();
            }
            else {
                if (this.x == this.maxWidth) {
                    this.newLine();
                }
                this.x++;
            }
        }
    }
    newLine() {
        this.x = 0;
        this.y++;
    }
}
export class CLIWindow {
    constructor(asciiCharacterStream, outputBufferUpdater, cursorUpdater, width) {
        this.asciiCharacterStream = asciiCharacterStream;
        this.outputBufferUpdater = outputBufferUpdater;
        this.cursorUpdater = cursorUpdater;
        this.buffer = "";
        this.stdin = new Stream();
        this.stdout = new Stream();
        this.cursorPosition = new CursorPositionHandler(width);
        setInterval(() => {
            if (this.asciiCharacterStream.hasListeners()) {
                this.cursorVisible = !this.cursorVisible;
            }
            else {
                this.cursorVisible = false;
            }
            cursorUpdater(this.cursorPosition.getX(), this.cursorPosition.getY(), this.cursorVisible);
        }, 600);
        let stdoutListenHelper = (characterCode) => {
            if (Ascii.isPrintableCharacterCode(characterCode)) {
                let character = Ascii.getPrintableCharacter(characterCode);
                this.cursorPosition.accountFor(character);
                this.buffer += character;
                outputBufferUpdater(this.buffer);
            }
            this.stdout.read().then(stdoutListenHelper);
        };
        this.stdout.read().then(stdoutListenHelper);
        let characterStreamHelper = (character) => {
            switch (character) {
                case Ascii.Codes.LeftArrow:
                    this.cursorPosition.moveLeft();
                    break;
                case Ascii.Codes.RightArrow:
                    this.cursorPosition.moveRight();
                    break;
                default:
                    this.stdin.write(character);
                    this.stdout.write(character);
            }
            this.asciiCharacterStream.read().then(characterStreamHelper);
        };
        this.asciiCharacterStream.read().then(characterStreamHelper);
    }
    resize(newWidth) {
        this.cursorPosition.resize(newWidth, this.buffer);
    }
}
//# sourceMappingURL=cliWindow.js.map