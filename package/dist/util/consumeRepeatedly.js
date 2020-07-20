export async function consumeRepeatedly(stream, callback) {
    try {
        let result = await stream.read();
        let shouldStop = callback(result);
        if (!shouldStop) {
            return await consumeRepeatedly(stream, callback);
        }
    }
    catch (_a) {
    }
}
//# sourceMappingURL=consumeRepeatedly.js.map