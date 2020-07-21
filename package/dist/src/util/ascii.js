export class Ascii {
    static isVisibleText(code) {
        return code == this.Codes.Tab ||
            code == this.Codes.NewLine ||
            code == this.Codes.Backspace ||
            code == this.Codes.Delete ||
            (code >= 32 && code <= 126);
    }
}
Ascii.Codes = {
    Bell: 7,
    Backspace: 8,
    Tab: 9,
    NewLine: 10,
    ClearScreen: 12,
    LeftArrow: 17,
    RightArrow: 18,
    DownArrow: 19,
    UpArrow: 20,
    Delete: 127
};
//# sourceMappingURL=ascii.js.map