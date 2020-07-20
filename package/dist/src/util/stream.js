export class Stream {
    constructor() {
        this.listeners = [];
    }
    async read() {
        return new Promise((resolve, reject) => {
            this.listeners.push({
                resolve: resolve,
                reject: reject
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
    static writeString(stream, string) {
        for (let i = 0; i < string.length; i++) {
            stream.write(string.charCodeAt(i));
        }
    }
}
//# sourceMappingURL=stream.js.map