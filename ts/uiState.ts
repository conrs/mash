
const DOM_INPUT_ID = "input"
const DOM_OUTPUT_ID = "output"
const DOM_CURSOR_ID = "cursor"

/** Super naive state */
type UIStateItems = {
  outputBuffer?: string
}

class UIState {
  private data: UIStateItems
  private callbacks: Map<keyof UIStateItems, ((x: any) => void)[]> = new Map()

  constructor() {
    this.data = {}
  }
  set<T extends keyof UIStateItems>(key: T, value: UIStateItems[T]) {
    this.data[key] = value;
    this.notify(key)
  }
  get<T extends keyof UIStateItems>(key: T): UIStateItems[T] {
    return this.data[key]
  }
  subscribe<T extends keyof UIStateItems>(key: T, callback: (value: UIStateItems[T]) => any) {
    let subscribers = this.callbacks.get(key) || []

    subscribers.push(callback)

    this.callbacks.set(key, subscribers)
  }

  private notify<T extends keyof UIStateItems>(key: T) {
    let subscribers = this.callbacks.get(key) || []

    subscribers.forEach((subscriber) => subscriber(this.data[key]))
  }
}

declare global {
  var state: UIState
}

window.state = new UIState()

export default window.state


// type UIState = {
//   outputBuffer?: string
//   set: <T extends keyof UIState>(key: T, v: UIState[T]) => UIState
//   get: <T extends keyof UIState>(key: T) => UIState[T]
// }



// Set up our input streams. 
// Need to listen to STDIN (just any user keyboard actions) 
// Need to set up STDOUT stream such that it outputs to console 
// If these load then blink the cursor

// Need shell program which simply outputs a prompt and echos user input into it
setInterval(() => {
  let elem = document.getElementById(DOM_CURSOR_ID)
  if(elem.style.display === "") {
    elem.style.display = "none"
  } else {
    elem.style.display = ""
  }
}, 600);