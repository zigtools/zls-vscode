import { workspace, ExtensionContext, window } from "vscode";

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from "vscode-languageclient/node";

let outputChannel: vscode.OutputChannel;
let client: LanguageClient | null = null;

export function activate(context: ExtensionContext) {
  outputChannel = window.createOutputChannel("Zig Language Server");

  vscode.commands.registerCommand("zls.start", async () => {
    await startClient();
  });

  vscode.commands.registerCommand("zls.stop", async () => {
    await stopClient();
  });

  vscode.commands.registerCommand("zls.restart", async () => {
    await stopClient();
    await startClient();
  });

  startClient();
}

function startClient(): Promise<void> {
  const configuration = workspace.getConfiguration("zls");
  const zlsPath = configuration.get("path", "zls");
  const debugLog = configuration.get("debugLog", false);

  let serverOptions: ServerOptions = {
    command: zlsPath,
    args: debugLog ? [ "--debug-log" ] : []
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "zig" }],
    outputChannel,
  };  

  // Create the language client and start the client.
  client = new LanguageClient(
    "zls",
    "Zig Language Server",
    serverOptions,
    clientOptions
  );

  return new Promise<void>(resolve => {
    if (client)
      client.start().catch(err => {
        window.showErrorMessage("Could not create zls language client! Please ensure the zls executable is either in your PATH or its path is specified in `zls.path`!");
        client = null;
      }).then(() => {
        window.showInformationMessage("zls language client started!");
        resolve();
      });
  });
}

async function stopClient(): Promise<void> {
  if (client) await client.stop();
  window.showInformationMessage("zls language client stopped!");
}

export function deactivate(): Thenable<void> {
  return stopClient();
}
