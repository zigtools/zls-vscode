# Zig Language Server (zls) for VSCode

[![VSCode Extension](https://img.shields.io/badge/vscode-extension-brightgreen)](https://marketplace.visualstudio.com/items?itemName=AugusteRame.zls-vscode)

`zls-vscode` is a language client extension for [`zls`](https://github.com/zigtools/zls), the awesome Zig Language Server.

## Installing

Simply install the extension and follow the instructions in the "It seems that we couldn't find your zls install" popup if it appears - we recommend clicking the "Install zls for me!" button if you're a typical user that's not planning to contribute to zls itself. :)

If you *aren't* a typical user, follow the instructions [https://github.com/zigtools/zls#from-source](here) and then add zls to your system PATH or specify the path of the zls binary with the `zls.path` option in VSCode!

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
