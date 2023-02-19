# Zig Language Server (zls) for VSCode

## THIS EXTENSION IS DEPRECATED

**Please use https://marketplace.visualstudio.com/items?itemName=ziglang.vscode-zig instead**

[![VSCode Extension](https://img.shields.io/badge/vscode-extension-brightgreen)](https://marketplace.visualstudio.com/items?itemName=AugusteRame.zls-vscode)

`zls-vscode` is a language client extension for [`zls`](https://github.com/zigtools/zls), the awesome Zig Language Server.

## Installing

Simply install the extension from the [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=AugusteRame.zls-vscode) or the Extensions tab and you'll be good to go!

### Building from source

If you want to build zls yourself, follow the instructions [here](https://github.com/zigtools/zls#from-source) and then specify the path of the zls binary with the `zls.path` option in VSCode!  


**Building Zig Language Server**

Dependencies:

- [npm](https://nodejs.org/en/download/)

Install [the VSCode Extensions command line tool](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), clone this repository and build the VSIX package. 

```sh
npm install -g @vscode/vsce
git clone https://github.com/zigtools/zls-vscode
cd zls-vscode
vsce package
```

Finally...
1. open the Extensions tab in VSCode
2. click on the dree dots in the upper right corner of the Extensions tab
3. choose "Install from VSIX..." and choose the .vsix file you just created.


Happy Zig-ing!

## Release Notes

### 1.0.0

> Initial release!

### 1.0.1

> Added Official Zig Extension independent Zig language detection

### 1.0.2

> Added start, stop, and restart commands

### 1.0.3

> Semantic tokens!

### 1.0.4

> Added debugLog

### 1.0.5

> Added in-editor configuration, for example:
```json
{
    "zls.warn_style": true,
    "zls.enable_semantic_tokens": false,
    "zls.operator_completions": true,
    "zls.include_at_in_builtins": false,
}
```
instead of using `zls.json`!
> Fix start/stop/restart commands

### 1.1.0

> You can now install zls directly from the extension! Enjoy!

### 1.1.1, 1.1.2

> Bug fixes, more streamlined installation
