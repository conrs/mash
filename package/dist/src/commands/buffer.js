import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";
import { util } from "..";
import { BufferedStreamWriter } from "../util";
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
        this.bufferedStdout = new BufferedStreamWriter(stdout);
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
                return true;
            }).then(() => resolve(0));
        });
    }
    isAtEndOfBuffer() {
        return (this.cursorY == this.bufferXYIndices.length - 1 &&
            this.cursorX == this.bufferXYIndices[this.cursorY].length);
    }
    bufferIndex(x = this.cursorX, y = this.cursorY) {
        return this.bufferXYIndices[y][x];
    }
    handleCharacterCode(characterCode, shouldWriteStdout = true) {
        if (Ascii.isVisibleText(characterCode)) {
            if (this.isAtEndOfBuffer()) {
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
                        this.bufferedStdout.write(Ascii.Codes.NewLine);
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
                    this.bufferedStdout.write(characterCode);
                }
                return true;
            }
            else {
                if (characterCode == Ascii.Codes.Backspace) {
                    if (this.cursorX == 0 && this.cursorY == 0) {
                        return false;
                    }
                    let lhs = this.buffer.substring(0, this.bufferIndex() - 1);
                    let rhs = this.buffer.substring(this.bufferIndex());
                    this.buffer = lhs + rhs;
                    let newLineArray = [];
                    for (let x = 0; x < this.cursorX; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x]);
                    }
                    for (let x = this.cursorX + 1; x < this.bufferXYIndices[this.cursorY].length; x++) {
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
                    let lhs = this.buffer.substring(0, this.bufferIndex());
                    let rhs = this.buffer.substring(this.bufferIndex());
                    this.buffer = lhs + String.fromCharCode(characterCode) + rhs;
                    let newLineArray = [];
                    for (let x = 0; x <= this.cursorX; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x]);
                    }
                    newLineArray.push(this.bufferXYIndices[this.cursorY][this.cursorX] + 1);
                    for (let x = this.cursorX + 1; x < this.bufferXYIndices[this.cursorY].length; x++) {
                        newLineArray.push(this.bufferXYIndices[this.cursorY][x] + 1);
                    }
                    for (let y = this.cursorY; y < this.bufferXYIndices.length; y++) {
                        for (let x = 0; x < this.bufferXYIndices[y].length; x++) {
                            this.bufferXYIndices[y][x] = this.bufferXYIndices[y][x] + 1;
                        }
                    }
                    this.bufferXYIndices[this.cursorY] = newLineArray;
                    this.cursorX++;
                    if (characterCode == util.Ascii.Codes.NewLine) {
                        console.log(this.bufferXYIndices);
                        this.bufferXYIndices[this.cursorY] = newLineArray.slice(0, this.cursorX + 1);
                        this.bufferXYIndices.splice(this.cursorY + 1, 0, newLineArray.slice(this.cursorX + 1));
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
            switch (characterCode) {
                case Ascii.Codes.DownArrow:
                    return this.moveDown(shouldWriteStdout);
                case Ascii.Codes.UpArrow:
                    return this.moveUp(shouldWriteStdout);
                case Ascii.Codes.LeftArrow:
                    return this.moveLeft(shouldWriteStdout);
                case Ascii.Codes.RightArrow:
                    return this.moveRight(shouldWriteStdout);
                case Ascii.Codes.Delete:
                    return false;
                default:
                    if (shouldWriteStdout)
                        this.stdout.write(characterCode);
                    return true;
            }
        }
    }
    moveLeft(shouldWriteStdout = false) {
        if (this.cursorX > 0) {
            this.cursorX--;
            if (shouldWriteStdout)
                this.stdout.write(util.Ascii.Codes.LeftArrow);
            return true;
        }
        else {
            return false;
        }
    }
    moveRight(shouldWriteStdout = false) {
        if (this.cursorX < this.bufferXYIndices[this.cursorY].length) {
            this.cursorX++;
            if (shouldWriteStdout)
                this.stdout.write(util.Ascii.Codes.RightArrow);
            return true;
        }
        else {
            return false;
        }
    }
    moveUp(shouldWriteStdout = false) {
        if (this.cursorY > 0) {
            this.cursorY--;
            if (shouldWriteStdout)
                this.stdout.write(util.Ascii.Codes.UpArrow);
            this.possiblyMoveX(shouldWriteStdout);
            return true;
        }
        else {
            return false;
        }
    }
    moveDown(shouldWriteStdout = false) {
        if (this.cursorY < this.bufferXYIndices.length - 1) {
            this.cursorY++;
            if (shouldWriteStdout)
                this.stdout.write(util.Ascii.Codes.DownArrow);
            this.possiblyMoveX(shouldWriteStdout);
            return true;
        }
        else {
            return false;
        }
    }
    possiblyMoveX(shouldWriteStdout = false) {
        let newX = Math.max(0, Math.min(this.cursorX, this.bufferXYIndices[this.cursorY].length - 1));
        if (shouldWriteStdout) {
            for (let i = 0; i < this.cursorX - newX; i++) {
                this.stdout.write(util.Ascii.Codes.LeftArrow);
            }
        }
        this.cursorX = newX;
    }
    nextLine(resetX = true) {
        if (typeof (this.bufferXYIndices[this.cursorY + 1]) === 'undefined') {
            this.bufferXYIndices[this.cursorY + 1] = [];
        }
        this.cursorY++;
        if (resetX)
            this.cursorX = 0;
    }
    flushAndRewriteBuffer() {
        this.bufferedStdout.clearBuffer();
        this.bufferedStdout.write(Ascii.Codes.ClearScreen);
        this.bufferedStdout.write(Ascii.stringToCharacterCodes(this.buffer));
    }
}
//# sourceMappingURL=buffer.js.map