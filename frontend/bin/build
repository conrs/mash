#!/bin/bash
set -e
set -x 

rm -rf html/js || true; 
tsc
webpack
docker build . -t local-registry/mash