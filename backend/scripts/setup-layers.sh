#!/bin/bash

# Create the directories if they don't already exist
mkdir -p dist/node-modules-layer/nodejs
mkdir -p dist/common-layer/nodejs
mkdir -p dist/table-stream-layer/nodejs

# Move the node_modules directory
cp -r node_modules dist/node-modules-layer/nodejs/

# Move the common/* files
mv dist/src/common/* dist/common-layer/nodejs/

# Move the table-stream/* files
mv dist/src/table-stream/* dist/table-stream-layer/nodejs/
