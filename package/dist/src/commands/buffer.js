import { Stream } from "../util/stream";
import { Ascii } from "../util/ascii";
import { CursorPositionHandler } from "../util/cursorPositionHandler";
import { BaseCommand } from "./baseCommand";
import { consumeRepeatedly } from "../util/consumeRepeatedly";
export class Buffer extends BaseCommand {
    constructor(stdin, stdout, width) {
        super(stdin, stdout);
        this.name = "buffer";
        this.helpText = "Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement";
        this.cursorPosition = new CursorPositionHandler(width);
        this.buffer = [];
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
                this.bufferCharacterCode(characterCode, true);
                return false;
            }).then(() => resolve(0));
        });
    }
    bufferCharacterCode(characterCode, moveCursor = true) {
        if (this.cursorPosition.handleCharacterCode(characterCode, moveCursor)) {
            if (Ascii.isPrintableCharacterCode(characterCode)) {
                if (!moveCursor || this.cursorPosition.isAtEnd()) {
                    this.buffer.push(characterCode);
                    this.stdout.write(characterCode);
                }
                else {
                    this.stdout.write(Ascii.Codes.ClearScreen);
                    let targetCursorX = this.cursorPosition.getX();
                    let targetCursorY = this.cursorPosition.getY();
                    let oldBuffer = this.buffer;
                    let bufferIndex = 0;
                    this.cursorPosition = new CursorPositionHandler(this.cursorPosition.maxWidth);
                    this.buffer = [];
                    while (this.cursorPosition.getX() != targetCursorX ||
                        this.cursorPosition.getY() != targetCursorY) {
                        let characterCode = oldBuffer[bufferIndex];
                        this.bufferCharacterCode(characterCode);
                        bufferIndex++;
                    }
                    this.bufferCharacterCode(characterCode, false);
                    oldBuffer.slice(bufferIndex).forEach((characterCode) => this.bufferCharacterCode(characterCode, false));
                }
            }
            else {
                this.stdout.write(characterCode);
            }
        }
    }
}
//# sourceMappingURL=buffer.js.map