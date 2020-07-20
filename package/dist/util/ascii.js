export class Ascii {
    static isPrintableCharacterCode(code) {
        return code == 10 ||
            (code >= 32 && code <= 126);
    }
    static getPrintableCharacter(code) {
        if (Ascii.isPrintableCharacterCode(code)) {
            return String.fromCharCode(code);
        }
    }
}
Ascii.Codes = {
    Bell: 7,
    LeftArrow: 8,
    RightArrow: 9,
    DownArrow: 11,
    UpArrow: 13,
    ClearScreen: 12,
    NewLine: 10
};
//# sourceMappingURL=ascii.js.map