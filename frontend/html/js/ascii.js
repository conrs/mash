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
    LeftArrow: 75,
    RightArrow: 77
};
//# sourceMappingURL=ascii.js.map