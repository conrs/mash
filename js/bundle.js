!function(e){var t={};function r(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=e,r.c=t,r.d=function(e,t,s){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(r.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(s,i,function(t){return e[t]}.bind(null,i));return s},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";r.r(t);var s={};r.r(s),r.d(s,"Ascii",(function(){return n})),r.d(s,"Stream",(function(){return a})),r.d(s,"LineReader",(function(){return h})),r.d(s,"sleep",(function(){return c})),r.d(s,"request",(function(){return d}));var i={};r.r(i),r.d(i,"Command",(function(){return o})),r.d(i,"Buffer",(function(){return p})),r.d(i,"Mash",(function(){return B}));class o{constructor(){}}class n{static isVisibleText(e){return e==this.Codes.Tab||e==this.Codes.NewLine||e==this.Codes.Backspace||e==this.Codes.Delete||e>=32&&e<=126}static fromCharCode(e){return String.fromCharCode(e)}static characterCodesToString(e){return e.map(n.fromCharCode).join("")}static stringToCharacterCodes(e){return e.split("").map(e=>e.charCodeAt(0))}}n.Codes={StartOfText:2,EndOfTransmission:4,Bell:7,Backspace:8,Tab:9,NewLine:10,ClearScreen:12,CarriageReturn:13,Cancel:24,LeftArrow:17,RightArrow:18,DownArrow:19,UpArrow:20,Delete:127};class a{constructor(){this.buffer=[],this.listener=void 0}hasListener(){return void 0!==this.listener}write(e){if(e=Array.isArray(e)?e:[e],this.buffer=this.buffer.concat(e),this.listener){let e=this.listener.resolve;this.listener=void 0,e()}}read(){if(this.listener)throw new Error("whoa there - one read or listen at a time dawg");let e=this.buffer;return this.buffer=[],e}wait(){if(this.listener)throw new Error("more than one thing is waiting on this stream");return new Promise((e,t)=>{let r=this.read();this.listener={resolve:e,reject:t},r.length>0&&this.write(r)})}async flush(){let e=0;await new Promise(t=>{let r=setInterval(()=>{this.read().length>0?e=0:e++,e>=5&&(clearInterval(r),t())},1)})}async consume(e,t="none"){let r=!0;for(;r;)await this.wait(),r=!1!==e(this.read())}split(e=2){let t=[...Array(e).keys()].map(()=>new a);return this.consume(e=>t.forEach(t=>t.write(e))),t}pipe(e){this.consume(t=>e.write(t))}filter(e){let t=new a;return this.consume(r=>{t.write(r.filter(e))}),t}}class h{constructor(e){this.stream=e,this.lineBuffer=""}async readLine(){await this.stream.consume(e=>{for(let t=0;t<e.length;t++){let r=e[t];if(r==n.Codes.NewLine)return!1;r==n.Codes.Backspace?this.lineBuffer=this.lineBuffer.substring(0,this.lineBuffer.length-1):n.Codes.ClearScreen==r?this.lineBuffer="":n.isVisibleText(r)&&(this.lineBuffer+=n.fromCharCode(r))}return!0});let e=this.lineBuffer;return this.lineBuffer="",e}}function c(e){return new Promise(t=>setTimeout(t,e))}function d(e){return new Promise((t,r)=>{let s=new XMLHttpRequest;s.open(e.method||"GET",e.url),e.headers&&Object.keys(e.headers).forEach(t=>{s.setRequestHeader(t,e.headers[t])}),s.onload=()=>{s.status>=200&&s.status<300?t(s.response||s.responseText):r(s.statusText)},s.onerror=e=>{r(s.statusText)},s.send(e.body)})}class u{constructor(e,t){if(this.x=e,this.y=t,e<0||t<0||!Number.isInteger(e)||!Number.isInteger(t))throw new Error(`Invalid point (${e}, ${t}) -- must be positive integers.`)}}class l{constructor(e,t,r=new u(0,0)){this.stdout=e,this.nodeToLeft=t,this.point=r}handleNode(e){try{let t=this.getMovesForNode(e);return this.nodeToLeft=t.newNode,this.handleMoves(t),!0}catch(e){return!1}}reset(){this.nodeToLeft=void 0,this.point=new u(0,0),this.ohMagicRightNode=void 0}handleMoves(e){let t=e.x<0?n.Codes.LeftArrow:n.Codes.RightArrow,r=e.y<0?n.Codes.UpArrow:n.Codes.DownArrow,s=Math.abs(e.x),i=Math.abs(e.y);for(let e=0;e<s;e++)this.stdout.write(t);for(let e=0;e<i;e++)this.stdout.write(r);this.point.x+=e.x,this.point.y+=e.y}getMovesForNode(e){switch(e.character){case n.Codes.CarriageReturn:if(this.nodeToLeft){let e=this.nodeToLeft;for(;e.left&&e.left.character!=n.Codes.NewLine;)e=e.left;return{x:-1*this.point.x,y:0,newNode:e}}throw new Error("Carriage return does nothing");case n.Codes.DownArrow:let t=this.nodeToLeft?this.nodeToLeft.right:this.ohMagicRightNode;this.ohMagicRightNode=void 0;let r=this.getLine(t,"down");if(r.length>0){let e=Math.min(this.point.x,r.length-1);return{x:e-this.point.x,y:1,newNode:r[e]}}throw new Error("Moving down is not possible");case n.Codes.UpArrow:let s=this.getLine(this.nodeToLeft,"up");if(s.length>0){let e=Math.min(this.point.x,s.length-1);return{x:e-this.point.x,y:-1,newNode:s[e]}}throw new Error("Moving up is not possible");case n.Codes.Backspace:if(this.nodeToLeft){let e=this.nodeToLeft.left,t=this.nodeToLeft.right;if(e&&(e.right=t),t&&(t.left=e),n.Codes.NewLine==this.nodeToLeft.character){let e=this.getLine(this.nodeToLeft,"up");return this.ohMagicRightNode=this.nodeToLeft,{x:e.length-1-this.point.x,y:-1,newNode:this.nodeToLeft.left}}return this.ohMagicRightNode=this.nodeToLeft,{x:-1,y:0,newNode:this.nodeToLeft.left}}break;case n.Codes.LeftArrow:if(this.nodeToLeft){if(this.ohMagicRightNode=this.nodeToLeft,n.Codes.NewLine==this.nodeToLeft.character){let e=this.getLine(this.nodeToLeft,"up");return this.ohMagicRightNode=this.nodeToLeft,{x:e.length-1-this.point.x,y:-1,newNode:this.nodeToLeft.left}}return this.ohMagicRightNode=this.nodeToLeft,{x:-1,y:0,newNode:this.nodeToLeft.left}}throw new Error("Moving left is not possible");case n.Codes.RightArrow:let i=this.nodeToLeft?this.nodeToLeft.right:this.ohMagicRightNode;if(this.ohMagicRightNode=void 0,i)return n.Codes.NewLine==i.character?{x:-1*this.point.x,y:1,newNode:i}:{x:1,y:0,newNode:i};throw new Error("Moving right is not possible");case n.Codes.Delete:if(this.nodeToLeft.right)return{x:0,y:0,newNode:this.nodeToLeft};throw new Error("No character to the right of current cursor");case n.Codes.NewLine:return{x:-1*this.point.x,y:1,newNode:e};default:return this.ohMagicRightNode=void 0,e.left=this.nodeToLeft,this.nodeToLeft&&(this.nodeToLeft.right=e),{x:1,y:0,newNode:e}}}getLine(e,t){let r=e,s=[],i="up"==t?"left":"right";if(r){for(;r[i]&&r.character!=n.Codes.NewLine;)r=r[i];for(r=r[i];r&&r.character!=n.Codes.NewLine;)s.push(r),r=r[i];"left"==i&&(s=s.reverse())}return s}}function f(e,t,r){return 0==e.length?t:f(e.slice(1),r(t,e[0]),r)}class w{constructor(e,t,r){this.character=e,this.left=t,this.right=r}static fromString(e){return f(e.split(""),void 0,(e,t)=>{let r=new m(t.charCodeAt(0),e);return e&&(e.right=r),r})}}class m extends w{}class g extends w{constructor(e,t){super(n.Codes.NewLine,e,t),this.left=e,this.right=t}}class p extends o{constructor(){super(),this.name="buffer",this.helpText="Provides a buffer for user input, echoing it to standard out, and allowing for cursor movement"}async run(e,t,r=[]){if(this.maxWidth=r[0]?parseInt(r[0],10):Number.MAX_SAFE_INTEGER,this.maxWidth<=0||!Number.isInteger(this.maxWidth))throw new Error(`Invalid max width: ${this.maxWidth}. Must be a positive integer`);return this.stdout=t,this.cursorManager=new l(this.stdout),r.length>1?(t.write(n.stringToCharacterCodes(`Too many arguments passed to ${this.name}: ${r}`)),1):new Promise((r,s)=>{e.consume(e=>{for(let r=0;r<e.length;r++){let s=e[r];if(s==n.Codes.ClearScreen){for(;this.cursorManager.nodeToLeft;)t.write(n.Codes.LeftArrow),this.cursorManager.nodeToLeft=this.cursorManager.nodeToLeft.left;for(;this.lastNode;)t.write(n.Codes.Backspace),this.lastNode=this.lastNode.left;this.cursorManager.reset()}else s==n.Codes.StartOfText?(this.cursorManager.reset(),this.lastNode=void 0,this.stdout.write(n.Codes.StartOfText)):this.handleCharacterCode(s)}}).catch(()=>r(1))})}handleCharacterCode(e){var t;let r=new m(e,this.cursorManager.nodeToLeft),s=!this.lastNode||this.cursorManager.nodeToLeft==this.lastNode||(null===(t=this.cursorManager.nodeToLeft)||void 0===t?void 0:t.left)==this.lastNode;if(this.cursorManager.handleNode(r)&&n.isVisibleText(e))if(s)this.lastNode=this.cursorManager.nodeToLeft,this.stdout.write(r.character),this.cursorManager.point.x>=this.maxWidth&&(this.cursorManager.handleNode(new g(this.lastNode)),this.lastNode=this.cursorManager.nodeToLeft,this.stdout.write(n.Codes.NewLine));else{let t=[],r=this.lastNode,s=e==n.Codes.Backspace?this.cursorManager.nodeToLeft:this.cursorManager.nodeToLeft.left;for(;r!=s;)this.stdout.write(n.Codes.Backspace),r instanceof m&&t.push(r),r=r.left;e==n.Codes.Backspace?this.stdout.write(e):s?this.stdout.write(this.cursorManager.nodeToLeft.character):this.stdout.write(e);let i=new l(new a,this.cursorManager.nodeToLeft,this.cursorManager.point),o=this.cursorManager.nodeToLeft;for(;t.length>0;){let e=t.pop();if(e.left=o,o.right=e,this.stdout.write(e.character),i.handleNode(e),i.point.x==this.maxWidth){let t=new g(e);this.stdout.write(n.Codes.NewLine),e.right=t,i.handleNode(t),o=t}else o=e}}}}class C{}class y{}class T extends y{constructor(e){super(),this.nodes=e}children(){return this.nodes}}class b extends class{constructor(e,t=[]){this.root=e,this.pwd=t}async cd(e){let t=this.getSanitizedAbsolutePath(e);return!!await this.getNodeAtPath(e)&&(this.pwd=t,!0)}async getNodeAtPath(e){let t=this.getSanitizedAbsolutePath(e);if(t){let e=this.root;for(;t.length>0;){if(e instanceof C)return;if(e instanceof y){let r=await e.children(),s=t.shift();if(!r[s])return;e=r[s]}}return e}}getSanitizedAbsolutePath(e){const t=e.split("/");let r=""===t[0]?t:this.pwd.concat(t),s=[];for(let e=0;e<r.length;e++)switch(r[e]){case".":case"":break;case"..":if(0!=s.length){s.pop();break}return;default:s.push(r[e])}return s}}{constructor(){super(new T({blog:new L("https://api.github.com/repos/conrs/blog/contents/_posts")}))}}class L extends y{constructor(e){super(),this.url=e}async children(){if(!this.nodes){let e=await d({url:this.url}),t=JSON.parse(e);this.nodes={},t.forEach(e=>{switch(e.type){case"file":this.nodes[e.name]=new x(e.download_url);break;case"dir":this.nodes[e.name]=new L(e.url)}})}return this.nodes}}class x extends C{constructor(e){super(),this.url=e}async contents(){return this._contents||(this._contents=await(await d({url:this.url}))),this._contents}}class A extends o{constructor(e){super(),this.filesystem=e}async run(e,t,r){let i=r[0]?r[0]:".",o=0,n=await this.filesystem.getNodeAtPath(i);if(void 0===n)o=1,await t.write(s.Ascii.stringToCharacterCodes(`Error: Path '${i}' doesn't exist`));else if(n instanceof C)await t.write(s.Ascii.stringToCharacterCodes(i));else if(n instanceof y){let e=await n.children(),r=Object.keys(e).map(t=>e[t]instanceof y?t+"/":t);await t.write(s.Ascii.stringToCharacterCodes(r.join("\n")))}return o}}class N extends o{constructor(e){super(),this.filesystem=e}async run(e,t,r){let i=r[0]?r[0]:"",o=0,n=await this.filesystem.getNodeAtPath(i);if(void 0===n)o=1,await t.write(s.Ascii.stringToCharacterCodes(`Error: Path '${i}' doesn't exist`));else if(n instanceof C){let e=await n.contents();t.write(s.Ascii.stringToCharacterCodes(e))}else n instanceof y&&(o=1,await t.write(s.Ascii.stringToCharacterCodes(`Error: Path '${i}' is not a file`)));return o}}class v extends o{constructor(e){super(),this.filesystem=e}async run(e,t,r){let s=r[0]?r[0]:"",i=await this.filesystem.cd(s)?0:1;return 0!=i?t.write(n.stringToCharacterCodes(`Path '${s}' not found.`)):t.write(n.stringToCharacterCodes("Okey dokey.")),i}}class E extends o{async run(e,t,r){return t.write(s.Ascii.stringToCharacterCodes(r?r.join(" "):"")),0}}class M extends o{async run(e,t,r){let i=1;if(r&&r[0]){let e=parseInt(r[0],10);NaN!=e&&Number.isInteger(e)&&i>0&&i<26?i=e:t.write(s.Ascii.stringToCharacterCodes(`Invalid rotation value: '${e}' - must be positive integer no larger than 25`))}return await e.consume(e=>{try{e.forEach(e=>{if(e==s.Ascii.Codes.EndOfTransmission)throw new S;e>=65&&e<=90?(e+=i)>90&&(e=e-91+65):e>=97&&e<=122&&(e+=i)>122&&(e=e-123+97),t.write(e)})}catch(e){if(e instanceof S)return!1}}),0}}class S{}class B extends o{constructor(){super(...arguments),this.command="mash",this.helpText="shell which interprets commands",this.filesystem=new b,this.shouldInterceptStdin=!1,this.historyTracker=new I,this.prompt=()=>`mash:/${this.filesystem.pwd.join("/")} $ `,this.commands={ls:new A(this.filesystem),cat:new N(this.filesystem),cd:new v(this.filesystem),echo:new E,rotate:new M}}async run(e,t,r=[]){let s=r[0]?parseInt(r[0],10):Number.MAX_SAFE_INTEGER,i=r[1]?r[1]:"",o=new a,[c,d]=e.split();d.consume(e=>{e.forEach(e=>{let t;n.Codes.UpArrow==e&&(t=this.historyTracker.moveUp()),n.Codes.DownArrow==e&&(t=this.historyTracker.moveDown()),void 0!==t?(this.bufferStdin.write(n.Codes.ClearScreen),this.bufferStdin.write(n.stringToCharacterCodes(t))):this.bufferStdin.write(e)})});let u=new a;(new p).run(u,o,[s.toString()]),this.stdin=c,this.bufferStdin=u;let[l,f]=o.split();for(l.consume(e=>{t.write(e)}),u.write(n.stringToCharacterCodes(i));;){u.write(n.stringToCharacterCodes(this.prompt())),u.write(n.Codes.StartOfText),this.shouldInterceptStdin=!0,await f.flush();let e=await new h(f).readLine();this.shouldInterceptStdin=!1,u.write(n.Codes.StartOfText),t.write([...Array(this.prompt().length).keys()].map(()=>n.Codes.LeftArrow)),await this.execute(e)}}async execute(e){this.historyTracker.addLine(e);try{let t=f(e.split("|"),{stream:this.stdin,run:()=>Promise.resolve()},(e,t)=>{let r=t.split(" ").filter(e=>""!=e),s=this.commands[r[0]],i=r.slice(1),o=new a;if(!s)throw new k(r.length>0?r[0]:"");return{run:async()=>e.run().then(async()=>{await s.run(e.stream,o,i),o.write(n.Codes.EndOfTransmission)}),stream:o}});t.stream.pipe(this.bufferStdin),await t.run(),this.bufferStdin.write(n.Codes.NewLine)}catch(e){if(!(e instanceof k))throw e;this.bufferStdin.write(n.stringToCharacterCodes(e.message))}}}class k extends Error{constructor(e){super(),this.message=`Command '${e}' not found.\n`}}class I{constructor(){this.commandHistory=[],this.currentIndex=0}moveUp(){if(this.currentIndex>0)return this.currentIndex--,this.commandHistory[this.currentIndex]}moveDown(){return this.currentIndex<this.commandHistory.length&&this.currentIndex++,this.currentIndex==this.commandHistory.length?"":this.commandHistory[this.currentIndex]}addLine(e){""!=e&&(this.commandHistory[this.commandHistory.length]=e,this.currentIndex=this.commandHistory.length)}}var R=function(e,t,r,s){return new(r||(r=Promise))((function(i,o){function n(e){try{h(s.next(e))}catch(e){o(e)}}function a(e){try{h(s.throw(e))}catch(e){o(e)}}function h(e){var t;e.done?i(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(n,a)}h((s=s.apply(e,t||[])).next())}))};class P{constructor(e,t,r){this.outputElement=e,this.cursorElement=t,this.stdin=r,this.cursorX=0,this.cursorY=0,this.yShouldBeAtBottom=!0,this.buffer="";let o=Math.floor(document.body.clientWidth/t.clientWidth*.87),n=new s.Stream,a=this.outputElement.innerHTML;this.outputElement.innerHTML="",this.mash=new i.Mash,this.mash.run(r,n,[o.toString(),a]),setInterval(()=>{this.stdin.hasListener()?this.cursorVisible=!this.cursorVisible:this.cursorVisible=!1,this.cursorElement.style.visibility=this.cursorVisible?"hidden":""},600),setInterval(()=>R(this,void 0,void 0,(function*(){let e=n.read();this.processCharacters(e),this.outputElement.innerHTML!=this.buffer&&(this.outputElement.innerHTML=this.buffer),this.yShouldBeAtBottom&&(this.yShouldBeAtBottom=!1,this.cursorY=this.outputElement.innerText.split("\n").length-1,document.body.scrollTop=Number.MAX_SAFE_INTEGER),this.cursorElement.style.left=(this.cursorX*(1.11*Math.round(1e4*t.getBoundingClientRect().width)/1e4)).toString(),this.cursorElement.style.top=(this.cursorY*t.getBoundingClientRect().height).toString()})),10)}processCharacters(e){e.forEach(e=>{switch(e){case s.Ascii.Codes.StartOfText:this.yShouldBeAtBottom=!0,document.getElementsByTagName("body")[0].scrollTop=20*document.getElementsByTagName("body")[0].clientHeight;break;case s.Ascii.Codes.UpArrow:this.yShouldBeAtBottom=!1,this.cursorY=Math.max(0,this.cursorY-1);break;case s.Ascii.Codes.DownArrow:this.cursorY++;break;case s.Ascii.Codes.LeftArrow:this.cursorX=Math.max(0,this.cursorX-1);break;case s.Ascii.Codes.RightArrow:this.cursorX++;break;case s.Ascii.Codes.Backspace:this.buffer=this.buffer.substring(0,this.outputElement.innerHTML.length-1),this.outputElement.innerHTML=this.buffer;break;default:s.Ascii.isVisibleText(e)&&(this.buffer+=s.Ascii.characterCodesToString([e])),document.body.scrollTop=Number.MAX_SAFE_INTEGER}})}}function _(){let e=function(e){let t=new s.Stream,r=i=>{i.forEach(e=>{let r=-1;1==e.length?r=e.charCodeAt(0):"Tab"==e?r="\t".charCodeAt(0):"Enter"==e?r="\n".charCodeAt(0):"ArrowLeft"==e?r=s.Ascii.Codes.LeftArrow:"ArrowRight"==e?r=s.Ascii.Codes.RightArrow:"ArrowDown"==e?r=s.Ascii.Codes.DownArrow:"ArrowUp"==e?r=s.Ascii.Codes.UpArrow:"Backspace"==e&&(r=s.Ascii.Codes.Backspace),-1!=r&&t.write(r)}),e.wait().then(()=>r(e.read()))};return e.wait().then(()=>r(e.read())),t}(function(){let e=new s.Stream;return document.addEventListener("keydown",(function(e){e.preventDefault()})),document.addEventListener("keyup",(function(t){e.write(t.key),t.stopPropagation(),t.preventDefault()})),e}()),t=document.getElementById("console_output"),r=document.getElementById("cursor");var i;i=e,document.addEventListener("paste",(function(e){let t=e.clipboardData.getData("text");i.write(s.Ascii.stringToCharacterCodes(t))}));new P(t,r,e)}window.meow=new b,document.addEventListener("readystatechange",(function e(t){"complete"===document.readyState&&(_(),document.removeEventListener("readystatechange",e))}));let O=void 0;document.addEventListener("touchstart",()=>{O=(new Date).getTime()},!1),document.addEventListener("touchend",()=>{O&&(new Date).getTime()-O<200&&(document.activeElement==document.getElementById("mobile_tricker")?document.getElementById("mobile_tricker").blur():document.getElementById("mobile_tricker").focus(),O=void 0)})}]);