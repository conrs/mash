export async function consumeRepeatedly(stream, callback) {
    try {
        return stream.read().then((val) => {
            let shouldContinue = callback(val);
            if (shouldContinue) {
                return consumeRepeatedly(stream, callback);
            }
        });
    }
    catch (e) {
    }
}
//# sourceMappingURL=consumeRepeatedly.js.map