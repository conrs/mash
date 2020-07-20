export class Ascii {
    static isPrintableCharacterCode(code) {
        return code == 10 ||
            code == 9 ||
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
    LeftArrow: 17,
    RightArrow: 18,
    DownArrow: 19,
    UpArrow: 20,
    ClearScreen: 12,
    NewLine: 10
};
//# sourceMappingURL=ascii.js.map