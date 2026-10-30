A shell-like web experience I use as my homepage.

Check it out live at https://con.rs

## Working on it

Node 22 (`.nvmrc`), npm.

```sh
npm install
npm test           # jest
npm run build      # typecheck, then webpack into public/js/bundle.js
```

Serve `public/` with any static server to try it locally.

## Deploying

`bin/deploy.sh "message"` builds, commits (force-adding the gitignored `public/js` bundle), pushes
`master`, and force-pushes a subtree split of `public/` to `gh-pages`, which GitHub Pages serves.

## Design notes

- The buffer is one-dimensional. Its contents may include HTML that renders as less visible text,
  so the buffer alone can't handle 2D cursor movement; the renderer feeds it the right number of
  left or right arrows to reach a position instead.
- Errors use an Either type, so every known error is in the type signature and callers can see
  what they'd need to handle (or, let's be honest, ignore).
- The `decode` command and the glitchy side-door layer (`src/arg/`) are an engine only: what a phrase
  leads to, which doors open and what's behind them come from a small JSON endpoint at runtime, so
  this repo can stay public without spoiling anything.
