#!/bin/sh
set -e

# See https://github.com/vercel/next.js/discussions/30468
npm i --no-save @swc/core @swc/cli

npm run dev
