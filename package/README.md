# Mash (npm package)

This project creates a simplified shell abstraction in Typescript. 

Commands operate via ASCII character streams and optional arguments. 

Parsing & bash-like syntax is supported for combinations of commands. 

Since the interface is constrained, aggregation of behavior is trivial. This is the true power of the shell. 

## How it works

Mash expects two streams to be passed to it. These are both ASCII character streams.

- STDIN represents a stream of user input.
- STDOUT is a stream Mash will write results to. 

It is up to you to display this stream.