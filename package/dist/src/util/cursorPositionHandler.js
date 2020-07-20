import { Ascii } from "./ascii.js";
export class CursorPositionHandler {
    constructor(maxWidth = 1000000000) {
        this.maxWidth = maxWidth;
        this.xOffset = 0;
        this.yOffset = 0;
        this.x = 0;
        this.y = 0;
    }
    getX() {
        console.log(`x: ${this.x} offs: ${this.xOffset}`);
        return this.x + this.xOffset;
    }
    getY() {
        return this.y + this.yOffset;
    }
    resize(newWidth, buffer) {
        this.constructor(newWidth);
        this.handleBuffer(buffer);
    }
    handleBuffer(buffer, moveCursor = true) {
        if (moveCursor) {
            this.xOffset = 0;
            this.yOffset = 0;
        }
        buffer.forEach((characterCode) => this.handleCharacterCode(characterCode, moveCursor));
    }
    handleCharacterCode(characterCode, moveCursor = true) {
        if (Ascii.isPrintableCharacterCode(characterCode)) {
            if (characterCode == Ascii.Codes.NewLine) {
                this.newLine(moveCursor);
            }
            else {
                if (this.x == this.maxWidth) {
                    this.newLine(moveCursor);
                }
                this.x++;
                if (!moveCursor) {
                    this.xOffset--;
                }
            }
            return true;
        }
        else {
            switch (characterCode) {
                case Ascii.Codes.DownArrow:
                    return this.moveDown();
                case Ascii.Codes.UpArrow:
                    return this.moveUp();
                case Ascii.Codes.LeftArrow:
                    return this.moveLeft();
                case Ascii.Codes.RightArrow:
                    return this.moveRight();
                default:
                    return true;
            }
        }
    }
    isAtEnd() {
        return this.xOffset == 0 && this.yOffset == 0;
    }
    newLine(moveCursor = true) {
        this.x = 0;
        this.y++;
        if (!moveCursor) {
            this.yOffset--;
        }
    }
    moveLeft() {
        if ((this.x + this.xOffset) > 0) {
            console.log("did it");
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
    moveUp() {
        if (this.y + this.yOffset > 0) {
            this.yOffset--;
            return true;
        }
        else {
            return false;
        }
    }
    moveDown() {
        if (this.yOffset < 0) {
            this.yOffset++;
            return true;
        }
        else {
            return false;
        }
    }
}
//# sourceMappingURL=cursorPositionHandler.js.map