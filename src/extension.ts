import * as path from 'path';
import { workspace, ExtensionContext, commands, OutputChannel, window } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from 'vscode-languageclient';
import { SemanticTokensFeature } from 'vscode-languageclient/lib/semanticTokens.proposed';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const zlsPath = workspace.getConfiguration('zigLanguageClient').get('path', '');
  
  if (!zlsPath) {
    window.showErrorMessage("Failed to find zls executable! Please specify its path in your settings with `zigLanguageClient.path`.");
    return;
  }

  let serverOptions: ServerOptions = {
    command: zlsPath,
    args: []
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

  client.registerFeature(new SemanticTokensFeature(client));
  client.start();
}

export function deactivate(): Thenable<void> {
  return client.stop();
}
