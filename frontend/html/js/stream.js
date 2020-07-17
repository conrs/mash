var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class Stream {
    constructor() {
        this.listeners = [];
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            let that = this;
            return new Promise((resolve, reject) => {
                that.listeners.push({
                    resolve: resolve,
                    reject: reject
                });
            });
        });
    }
    write(value) {
        if (this.listeners.length > 0)
            this.listeners.shift().resolve(value);
    }
    end() {
        while (this.listeners.length > 0) {
            this.listeners.shift().reject("Stream closed unexpectedly");
        }
    }
    hasListeners() {
        return this.listeners.length > 0;
    }
}
//# sourceMappingURL=stream.js.map