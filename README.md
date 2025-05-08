A shell-like web experience I use as my homepage.

Check it out live at https://conrs.github.io/mash

## Concepts 

BrowserCLIWindow (to be renamed) 
- Manages the buffer of text and current X position of the cursor. 
   <!> How to detect if rendered position different than raw X position? Needs to be in a container above this point. 


 ## Stuff

 - With the last implementation, we discovered that the buffer by itself cannot handle 2 dimensional cursor movements, as the contents may involve HTML which would be rendered into smaller visible text. Our thinking is to have the buffer be one dimensional, and have the renderer feed it the approprate number of left arrows or right arrows to get it to the correct position. This actually seems like a better design regardless.

 - I decided to go with an Either approach as this places all known errors into the type signature, thereby making it clear to invokers what they'd need to handle (or, let's be honest, ignore). 
