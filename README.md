# zls-vscode

[![VSCode Extension](https://img.shields.io/badge/vscode-extension-brightgreen)](https://marketplace.visualstudio.com/items?itemName=AugusteRame.zls-vscode)

`zls-vscode` is a language client extension for [`zls`](https://github.com/zigtools/zls), the awesome Zig Language Server.

## Installing

`zls-vscode` is the client extension for [ZLS](https://github.com/zigtools/zls). This means, **you will need to have ZLS compiled and configured** to use this extension, as this extension only *bridges* ZLS to Visual Studio Code.

[Installation instructions for ZLS](https://github.com/zigtools/zls#installation) can be found on the ZLS `README.md`. Once you run `zls config` it will walk you through configuring ZLS for Visual Studio Code and your installation of Zig.

In the future, we hope to make installing ZLS for Visual Studio Code much simpler.

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
