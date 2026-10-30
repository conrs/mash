#!/bin/bash
set -e
set -x 

rm -rf public/js || true; 
tsc --noEmit
webpack