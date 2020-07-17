import Stream from "./stream.js"

let stdin = new Stream<string>()

document.addEventListener('keydown', function(e)
{
  if(e.keyCode == 9)
  {
    e.preventDefault();
  }
});

document.addEventListener('keyup', function(e: KeyboardEvent) {
  stdin.write(e.key)
  
  e.stopPropagation()
  e.preventDefault();
});

export default stdin