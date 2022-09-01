import { workspace, ExtensionContext, window } from "vscode";

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from "vscode-languageclient/node";
import axios from "axios";
import { chmodSync, existsSync, writeFileSync } from "fs";
import * as mkdirp from "mkdirp";
import * as child_process from "child_process";

let outputChannel: vscode.OutputChannel;
let client: LanguageClient | null = null;

const downloadsRoot = "https://zig.pm/zls/downloads";

enum InstallationName {
  i386_linux = "i386-linux",
  i386_windows = "i386-windows",
  x86_64_linux = "x86_64-linux",
  x86_64_macos = "x86_64-macos",
  x86_64_windows = "x86_64-windows",
}

function getDefaultInstallationName(): InstallationName | null {
  // NOTE: Not using a JS switch because they're ugly as hell and clunky :(

  const plat = process.platform;
  const arch = process.arch;
  if (arch === "ia32") {
    if (plat === "linux") return InstallationName.i386_linux;
    else if (plat === "win32") return InstallationName.i386_windows;
  } else if (arch === "x64") {
    if (plat === "linux") return InstallationName.x86_64_linux;
    else if (plat === "darwin") return InstallationName.x86_64_macos;
    else if (plat === "win32") return InstallationName.x86_64_windows;
  }

  return null;
}

async function installExecutable(context: ExtensionContext): Promise<void> {
  const def = getDefaultInstallationName();
  if (!def) {
    window.showInformationMessage(`Your system isn't built by our CI!\nPlease follow the instructions [here](https://github.com/zigtools/zls#from-source) to get started!`);
    return;
  }

  return window.withProgress({
    title: "Installing zls...",
    location: vscode.ProgressLocation.Notification,
  }, async progress => {
    progress.report({message: "Downloading build runner..."});
    const buildRunner = (await axios.get(`${downloadsRoot}/${def}/bin/build_runner.zig`)).data;
    progress.report({message: "Downloading zls executable..."});
    const exe = (await axios.get(`${downloadsRoot}/${def}/bin/zls${def.endsWith("windows") ? ".exe" : ""}`, {
      responseType: "arraybuffer"
    })).data;

    progress.report({message: "Installing..."});
    const installDir = vscode.Uri.joinPath(context.globalStorageUri, "zls_install");
    if (!existsSync(installDir.fsPath))
      mkdirp.sync(installDir.fsPath);

    const zlsBinPath = vscode.Uri.joinPath(installDir, `zls${def.endsWith("windows") ? ".exe" : ""}`).fsPath;

    writeFileSync(vscode.Uri.joinPath(installDir, `build_runner.zig`).fsPath, buildRunner);
    writeFileSync(zlsBinPath, exe, "binary");

    chmodSync(zlsBinPath, 0o755);

    let config = workspace.getConfiguration("zls");
    await config.update("path", zlsBinPath, true);

    startClient(context);
  });
}

export function activate(context: ExtensionContext) {
  outputChannel = window.createOutputChannel("Zig Language Server");

  vscode.commands.registerCommand("zls.install", async () => {
    installExecutable(context);
  });

  vscode.commands.registerCommand("zls.start", async () => {
    await startClient(context);
  });

  vscode.commands.registerCommand("zls.stop", async () => {
    await stopClient();
  });

  vscode.commands.registerCommand("zls.restart", async () => {
    await stopClient();
    await startClient(context);
  });

  vscode.commands.registerCommand("zls.openconfig", async () => {
    await openConfig();
  });

  startClient(context);
}

function startClient(context: ExtensionContext): Promise<void> {
  const configuration = workspace.getConfiguration("zls");
  const zlsPath = configuration.get("path", "zls");
  const debugLog = configuration.get("debugLog", false);

  let serverOptions: ServerOptions = {
    command: zlsPath,
    args: debugLog ? [ "--enable-debug-log" ] : []
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

  outputChannel.appendLine(`Attempting to use zls @ ${zlsPath}`);

  return new Promise<void>(resolve => {
    if (client)
      client.start().catch(err => {
        window.showInformationMessage("We're installing zls for you! Feel free to change your `zls.path` later if you so wish!");
        installExecutable(context);
        client = null;
      }).then(() => {
        if (client) {
          window.showInformationMessage("zls language client started!");
          resolve();
        }
      });
  });
}

async function stopClient(): Promise<void> {
  if (client) await client.stop();
  window.showInformationMessage("zls language client stopped!");
}

async function openConfig(): Promise<void> {
  const configuration = workspace.getConfiguration("zls");
  const zlsPath = configuration.get("path", "zls");

  const process = child_process.spawn(zlsPath, ['--show-config-path']);
  process.stdout.on('data', async (data)  => {
    const path: string = data.toString().trimEnd();
    vscode.window.showTextDocument(vscode.Uri.file(path), { preview: false });
  });
}

export function deactivate(): Thenable<void> {
  return stopClient();
}
