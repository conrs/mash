const DOM_INPUT_ID = "input";
const DOM_OUTPUT_ID = "output";
const DOM_CURSOR_ID = "cursor";
class UIState {
    constructor() {
        this.callbacks = new Map();
        this.data = {};
    }
    set(key, value) {
        this.data[key] = value;
        this.notify(key);
    }
    get(key) {
        return this.data[key];
    }
    subscribe(key, callback) {
        let subscribers = this.callbacks.get(key) || [];
        subscribers.push(callback);
        this.callbacks.set(key, subscribers);
    }
    notify(key) {
        let subscribers = this.callbacks.get(key) || [];
        subscribers.forEach((subscriber) => subscriber(this.data[key]));
    }
}
window.state = new UIState();
export default window.state;
setInterval(() => {
    let elem = document.getElementById(DOM_CURSOR_ID);
    if (elem.style.display === "") {
        elem.style.display = "none";
    }
    else {
        elem.style.display = "";
    }
}, 600);
//# sourceMappingURL=uiState.js.map