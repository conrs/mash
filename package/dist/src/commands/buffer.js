import { Stream } from "../util/stream.js";
import { Ascii } from "../util/ascii.js";
import { CursorPositionHandler } from "../util/cursorPositionHandler.js";
import { BaseCommand } from "./baseCommand.js";
import { consumeRepeatedly } from "../util/consumeRepeatedly.js";
export class Buffer extends BaseCommand {
    constructor(stdin, stdout, width) {
        super(stdin, stdout);
        this.name = "buffer";
        this.helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement";
        this.cursorPosition = new CursorPositionHandler(width);
        this.buffer = [];
    }
    static async run(stdin, stdout, args) {
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
                if (this.cursorPosition.handleCharacterCode(characterCode)) {
                    this.stdout.write(characterCode);
                }
                if (Ascii.isPrintableCharacterCode(characterCode)) {
                    this.bufferCharacterCode(characterCode);
                }
                return false;
            }).then(() => resolve(0));
        });
    }
    bufferCharacterCode(characterCode, moveCursor = true) {
        if (!moveCursor || this.cursorPosition.isAtEnd()) {
            this.buffer.push(characterCode);
        }
        else {
            this.stdout.write(Ascii.Codes.ClearScreen);
            let targetCursorX = this.cursorPosition.getX();
            let targetCursorY = this.cursorPosition.getY();
            let oldBuffer = [];
            let bufferIndex = 0;
            this.cursorPosition = new CursorPositionHandler(this.cursorPosition.maxWidth);
            this.buffer = [];
            while (this.cursorPosition.getX() != targetCursorX &&
                this.cursorPosition.getY() != targetCursorY) {
                let characterCode = oldBuffer[bufferIndex];
                this.cursorPosition.handleCharacterCode(characterCode);
                this.buffer.push(characterCode);
                bufferIndex++;
            }
            this.bufferCharacterCode(characterCode);
            oldBuffer.slice(bufferIndex).forEach((characterCode) => this.bufferCharacterCode(characterCode, false));
        }
    }
}
//# sourceMappingURL=buffer.js.map