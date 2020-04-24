import * as path from 'path';
import { workspace, ExtensionContext, commands, OutputChannel, window } from 'vscode';
import * as WebSocket from 'ws';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const zlsPath = workspace.getConfiguration('zigLanguageClient').get('path', '');
  let socket: WebSocket | null = null;
  
  if (!zlsPath) {
    window.showErrorMessage("Failed to find zls executable! Please specify its path in your settings with `zigLanguageClient.path`.");
    return;
  }

  let serverOptions: ServerOptions = {
    command: zlsPath,
    args: []
  };

  commands.registerCommand('zigLanguageClient.startStreaming', () => {
    socket = new WebSocket(`ws://localhost:7000`);
  });

  let log = '';
	const websocketOutputChannel: OutputChannel = {
		name: 'websocket',
		// Only append the logs but send them later
		append(value: string) {
			log += value;
			console.log(value);
		},
		appendLine(value: string) {
			log += value;
			// Don't send logs until WebSocket initialization
			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.send(log);
			}
			log = '';
		},
		clear() {},
		show() {},
		hide() {},
		dispose() {}
	};

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'zig' }],
    outputChannel: websocketOutputChannel //window.createOutputChannel("Zig Language Server")
  };  

  // Create the language client and start the client.
  client = new LanguageClient(
    'zigLanguageClient',
    'Zig Language Server Client',
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> {
  return client.stop();
}
