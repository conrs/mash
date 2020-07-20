export class Stream {
    constructor() {
        this.listeners = [];
        this.buffer = [];
    }
    async read() {
        return new Promise((resolve, reject) => {
            if (this.buffer.length > 0)
                resolve(this.buffer.shift());
            else
                this.listeners.push({
                    resolve: resolve,
                    reject: reject
                });
        });
    }
    write(value) {
        if (this.listeners.length > 0)
            this.listeners.shift().resolve(value);
        else
            this.buffer.push(value);
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