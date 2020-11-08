import { workspace, ExtensionContext, window } from 'vscode';

import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const zlsPath = workspace.getConfiguration('zigLanguageClient').get('path', '');
  const debugLog = workspace.getConfiguration('zigLanguageClient').get('debugLog', false);
  
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
    documentSelector: [{ scheme: 'file', language: 'zig' }],
    outputChannel: window.createOutputChannel("Zig Language Server")
  };  

  // Create the language client and start the client.
  client = new LanguageClient(
    'zigLanguageClient',
    'Zig Language Server Client',
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
