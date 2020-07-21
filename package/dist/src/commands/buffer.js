import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";
export class Buffer extends BaseCommand {
    constructor(stdin, stdout, maxWidth = 100) {
        super(stdin, stdout);
        this.maxWidth = maxWidth;
        this.name = "buffer";
        this.helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement";
        this.bufferXYIndices = [[]];
        this.cursorX = 0;
        this.cursorY = 0;
        this.buffer = "";
        this.bufferXYIndices = [[]];
    }
    static async run(stdin, stdout, args = []) {
        let width = args[0] ? parseInt(args[0], 10) : undefined;
        return new Buffer(stdin, stdout, width).run(args);
    }
    async run(args = []) {
        if (args.length > 1) {
            Stream.writeString(this.stdout, `Too many arguments passed to ${this.name}: ${args}`);
            return 1;
        }
        return new Promise((resolve, reject) => {
            consumeRepeatedly(this.stdin, (characterCode) => {
                this.handleCharacterCode(characterCode, true);
                return false;
            }).then(() => resolve(0));
        });
    }
    handleCharacterCode(characterCode, shouldWriteStdout = true) {
        if (Ascii.isVisibleText(characterCode)) {
            if (this.cursorX == this.bufferXYIndices[this.cursorY].length) {
                if (characterCode == Ascii.Codes.Backspace) {
                    if (this.cursorX > 0) {
                        this.cursorX--;
                    }
                    else if (this.cursorY > 0) {
                        this.cursorY--;
                        this.cursorX = this.bufferXYIndices[this.cursorY].length;
                    }
                    else {
                        return false;
                    }
                    this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                }
                else if (this.cursorX == this.maxWidth) {
                    if (shouldWriteStdout)
                        this.stdout.write(Ascii.Codes.NewLine);
                    this.nextLine();
                    return this.handleCharacterCode(characterCode, shouldWriteStdout);
                }
                else {
                    this.bufferXYIndices[this.cursorY][this.cursorX] = this.buffer.length;
                    this.buffer += String.fromCharCode(characterCode);
                    this.cursorX++;
                    if (characterCode == Ascii.Codes.NewLine) {
                        this.nextLine();
                    }
                }
                if (shouldWriteStdout) {
                    this.stdout.write(characterCode);
                }
                return true;
            }
            else {
                if (characterCode == Ascii.Codes.Backspace) {
                    if (this.cursorX == 0) {
                        return false;
                    }
                    let lhs = this.buffer.substring(0, this.cursorX - 1);
                    let rhs = this.buffer.substring(this.cursorX);
                    this.buffer = lhs + String.fromCharCode(characterCode) + rhs;
                    let newLineArray = [];
                    for (let x = 0; x < this.cursorX - 1; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x]);
                    }
                    newLineArray.push(this.cursorX);
                    newLineArray.push(this.cursorX + 1);
                    for (let x = this.cursorX; x < this.bufferXYIndices[this.cursorY].length; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x] - 1);
                    }
                    for (let y = this.cursorY; y < this.bufferXYIndices.length; y++) {
                        for (let x = 0; x < this.bufferXYIndices[y].length; x++) {
                            this.bufferXYIndices[y][x] = this.bufferXYIndices[y][x] - 1;
                        }
                    }
                    this.bufferXYIndices[this.cursorY] = newLineArray;
                    this.cursorX--;
                    if (shouldWriteStdout) {
                        this.flushAndRewriteBuffer();
                    }
                }
                else {
                    let lhs = this.buffer.substring(0, this.cursorX);
                    let rhs = this.buffer.substring(this.cursorX);
                    this.buffer = lhs + String.fromCharCode(characterCode) + rhs;
                    let newLineArray = [];
                    for (let x = 0; x < this.cursorX; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x]);
                    }
                    newLineArray.push(this.cursorX);
                    newLineArray.push(this.cursorX + 1);
                    for (let x = this.cursorX + 1; x < this.bufferXYIndices[this.cursorY].length; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x] + 1);
                    }
                    for (let y = this.cursorY; y < this.bufferXYIndices.length; y++) {
                        for (let x = 0; x < this.bufferXYIndices[y].length; x++) {
                            this.bufferXYIndices[y][x] = this.bufferXYIndices[y][x] + 1;
                        }
                    }
                    this.bufferXYIndices[this.cursorY] = newLineArray;
                    if (this.bufferXYIndices.length > this.maxWidth) {
                        let oldCursorX = this.cursorX;
                        let oldCursorY = this.cursorY;
                        this.nextLine();
                        this.cursorX = this.bufferXYIndices[this.cursorY].length;
                        this.handleCharacterCode(this.bufferXYIndices[this.cursorY].shift(), false);
                        this.cursorX = oldCursorX;
                        this.cursorY = oldCursorY;
                    }
                    this.cursorX++;
                    if (characterCode == Ascii.Codes.NewLine) {
                        this.nextLine();
                    }
                    if (shouldWriteStdout) {
                        this.flushAndRewriteBuffer();
                    }
                }
                return true;
            }
        }
        else {
            let success = false;
            switch (characterCode) {
                case Ascii.Codes.DownArrow:
                    success = this.moveDown();
                    break;
                case Ascii.Codes.UpArrow:
                    success = this.moveUp();
                    break;
                case Ascii.Codes.LeftArrow:
                    success = this.moveLeft();
                    break;
                case Ascii.Codes.RightArrow:
                    success = this.moveRight();
                    break;
                case Ascii.Codes.Delete:
                    success = false;
                    break;
                default:
                    success = true;
            }
            if (success && shouldWriteStdout) {
                this.stdout.write(characterCode);
            }
        }
    }
    moveLeft() {
        if (this.cursorX > 0) {
            this.cursorX--;
            return true;
        }
        else {
            return false;
        }
    }
    moveRight() {
        if (this.cursorX < this.bufferXYIndices[this.cursorY].length) {
            this.cursorX++;
            return true;
        }
        else {
            return false;
        }
    }
    moveUp() {
        if (this.cursorY > 0) {
            this.cursorY--;
            return true;
        }
        else {
            return false;
        }
    }
    moveDown() {
        if (this.cursorY < this.bufferXYIndices.length - 1) {
            this.cursorY++;
            return true;
        }
        else {
            return false;
        }
    }
    previousCursorPositionBufferIndex() {
        if (this.cursorX == 0 && this.cursorY == 0)
            return false;
        else if (this.cursorX > 0)
            return this.bufferXYIndices[this.cursorY][this.cursorX - 1];
        else
            return this.bufferXYIndices[this.cursorY - 1][this.bufferXYIndices[this.cursorY - 1].length - 1];
    }
    nextLine(resetX = true) {
        if (typeof (this.bufferXYIndices[this.cursorY + 1])) {
            this.bufferXYIndices[this.cursorY + 1] = [];
        }
        this.cursorY++;
        if (resetX)
            this.cursorX = 0;
    }
    flushAndRewriteBuffer() {
        this.stdout.write(Ascii.Codes.ClearScreen);
        for (let y = 0; y < this.bufferXYIndices.length; y++) {
            for (let x = 0; x < this.bufferXYIndices[y].length; x++) {
                this.stdout.write(this.buffer.charCodeAt(this.bufferXYIndices[y][x]));
            }
            if (y != this.bufferXYIndices.length - 1)
                this.stdout.write(Ascii.Codes.NewLine);
        }
    }
}
//# sourceMappingURL=buffer.js.map