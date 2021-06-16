
# zokrates-js with React demo

Builds on top of the [Truffle React box](https://www.trufflesuite.com/boxes/react).

## Set-up

### Required

- npm 7.12.1
- node v14.16.1
- truffle v5.3.4

(Using slightly outdated versions on purpose to avoid the node-gyp error appearing on MacOS)

Install node packages from package-lock.json in top level directory as well as client.

### Important adaptation of the truffle React box for using zokrates-js

Zokrates is written in Rust. In order to use code written in one of the C family of languages (C, C++, Rust) in a frontend, it needs to be bundled using [WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly). The Truffle React box includes Webpack; however, in order for zokrates-js to work with the following additional steps **had** to be carried out in the `client` subdirectory (you don't need to do any of this now as the setup should already be correct, just for the record):

1) Run `npm install --save-dev react-app-rewired wasm-loader`
2) Add a new file `config-overrides.js` with the following content:

```
const path = require('path')

module.exports = function override (config, env) {
  const wasmExtensionRegExp = /\.wasm$/
  config.resolve.extensions.push('.wasm')
  config.module.rules.forEach(rule => {
    (rule.oneOf || []).forEach(oneOf => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        oneOf.exclude.push(wasmExtensionRegExp)
      }
    })
  })

  config.module.rules.push({
    test: wasmExtensionRegExp,
    include: path.resolve(__dirname, 'src'),
    use: [{ loader: require.resolve('wasm-loader'), options: {} }]
  })

  return config
}
```
3. In `package.json`, change `react-scripts start` to `react-app-rewired start`:
```
"start": "react-app-rewired start",
````

(These instructions are taken from [here](https://github.com/matter-labs/zksync/issues/238)).

