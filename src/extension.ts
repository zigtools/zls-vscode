import { workspace, ExtensionContext, window } from "vscode";

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const configuration = workspace.getConfiguration("zls");
  const zlsPath = configuration.get("path", "");
  const debugLog = configuration.get("debugLog", false);
  
  if (!zlsPath) {
    window.showErrorMessage("Failed to find zls executable! Please specify its path in your settings with `zigLanguageClient.path`.");
    return;
  }

  let serverOptions: ServerOptions = {
    command: zlsPath,
    args: debugLog ? [ "--debug-log" ] : []
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "zig" }],
    outputChannel: window.createOutputChannel("Zig Language Server"),
  };  

  // Create the language client and start the client.
  client = new LanguageClient(
    "zls",
    "Zig Language Server",
    serverOptions,
    clientOptions
  );

  client.start();

  vscode.commands.registerCommand("zls.start", () => {
    client.start();
  });

  vscode.commands.registerCommand("zls.stop", async () => {
    await client.stop();
  });

  vscode.commands.registerCommand("zls.restart", async () => {
    await client.stop();
    client.start();
  });
}

export function deactivate(): Thenable<void> {
  return client.stop();
}
