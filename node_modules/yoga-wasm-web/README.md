# yoga-wasm-web

[Yoga](https://github.com/facebook/yoga) but in WebAssembly and ASM.js. 

## Usage

Install with your package manager:

```sh
pnpm i yoga-wasm-web
npm i yoga-wasm-web
yarn add yoga-wasm-web
```

### ASM.js

To use the ASM.js build:

```js
import initYoga, { ALIGN_CENTER } from 'yoga-wasm-web/asm'

const Yoga = initYoga()
const node = Yoga.Node.create()
node.setAlignContent(ALIGN_CENTER)
```

### WASM

To use the WASM build (take Node.js as an example):

```js
import fs from 'fs'
import initYoga, { ALIGN_CENTER } from 'yoga-wasm-web'

const Yoga = await initYoga(
  fs.readFileSync('./node_modules/yoga-wasm-web/dist/yoga.wasm')
)

const node = Yoga.Node.create()
node.setAlignContent(ALIGN_CENTER)
```

You can use other ways to provide the WASM binary too.


## Contribution

To develop this project locally, you need to clone the repo and fetch the yoga submodule first. Also, [emcc](https://emscripten.org/docs/getting_started/downloads.html) is required to build this project too.

After that, install npm dependencies:

```sh
pnpm i
```

And run the build script:

```sh
pnpm build
```

And run the tests:

```sh
pnpm test
```

# Acknowledgements

This project was started as **opinionated** fork from [pinqy520/yoga-layout-wasm](https://github.com/pinqy520/yoga-layout-wasm)
