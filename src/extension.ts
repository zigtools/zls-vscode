import { workspace, ExtensionContext, window } from "vscode";

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from "vscode-languageclient/node";
import axios from "axios";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as which from "which";
import * as mkdirp from "mkdirp";
import * as child_process from "child_process";

let outputChannel: vscode.OutputChannel;
let client: LanguageClient | null = null;

const downloadsRoot = "https://zig.pm/zls/downloads";

/* eslint-disable @typescript-eslint/naming-convention */
enum InstallationName {
  i386_linux = "i386-linux",
  i386_windows = "i386-windows",
  x86_64_linux = "x86_64-linux",
  x86_64_macos = "x86_64-macos",
  x86_64_windows = "x86_64-windows",
}
/* eslint-enable @typescript-eslint/naming-convention */

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

async function installExecutable(context: ExtensionContext): Promise<string | null> {
  const def = getDefaultInstallationName();
  if (!def) {
    window.showInformationMessage(`Your system isn't built by our CI!\nPlease follow the instructions [here](https://github.com/zigtools/zls#from-source) to get started!`);
    return null;
  }

  return window.withProgress({
    title: "Installing zls...",
    location: vscode.ProgressLocation.Notification,
  }, async progress => {
    progress.report({ message: "Downloading build runner..." });
    const buildRunner = (await axios.get(`${downloadsRoot}/${def}/bin/build_runner.zig`)).data;
    progress.report({ message: "Downloading zls executable..." });
    const exe = (await axios.get(`${downloadsRoot}/${def}/bin/zls${def.endsWith("windows") ? ".exe" : ""}`, {
      responseType: "arraybuffer"
    })).data;

    progress.report({ message: "Installing..." });
    const installDir = vscode.Uri.joinPath(context.globalStorageUri, "zls_install");
    if (!fs.existsSync(installDir.fsPath)) mkdirp.sync(installDir.fsPath);

    const zlsBinPath = vscode.Uri.joinPath(installDir, `zls${def.endsWith("windows") ? ".exe" : ""}`).fsPath;

    fs.writeFileSync(vscode.Uri.joinPath(installDir, `build_runner.zig`).fsPath, buildRunner);
    fs.writeFileSync(zlsBinPath, exe, "binary");

    fs.chmodSync(zlsBinPath, 0o755);

    let config = workspace.getConfiguration("zls");
    await config.update("path", zlsBinPath, true);

    startClient(context);

    return zlsBinPath;
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

async function startClient(context: ExtensionContext) {
  const configuration = workspace.getConfiguration("zls");
  const debugLog = configuration.get("debugLog", false);

  const zlsPath = await getZLSPath(context);

  if (!zlsPath) {
    window.showWarningMessage("Couldn't find Zig Language Server (ZLS) executable");
    return null;
  }

  let serverOptions: ServerOptions = {
    command: zlsPath,
    args: debugLog ? ["--enable-debug-log"] : []
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

  return client.start().catch(reason => {
    window.showWarningMessage(`Failed to run Zig Language Server (ZLS): ${reason}`);
    client = null;
  });
}

async function stopClient(): Promise<void> {
  if (client) await client.stop();
}

async function getZLSPath(context: ExtensionContext): Promise<string | null> {
  const configuration = workspace.getConfiguration("zls");
  var zlsPath = configuration.get<string | null>("path", null);

  if (!zlsPath) {
    zlsPath = which.sync('zls', { nothrow: true });
  } else if (zlsPath.startsWith("~")) {
    zlsPath = path.join(os.homedir(), zlsPath.substring(1));
  } else if (!path.isAbsolute(zlsPath)) {
    zlsPath = which.sync(zlsPath, { nothrow: true });
  }

  var message: string | null = null;

  const zlsPathExists = zlsPath !== null && fs.existsSync(zlsPath);
  if (zlsPath && zlsPathExists) {
    try {
      fs.accessSync(zlsPath, fs.constants.R_OK | fs.constants.X_OK);
    } catch {
      message = `\`zls.path\` ${zlsPath} is not an executable`;
    }
    const stat = fs.statSync(zlsPath);
    if (!stat.isFile()) {
      message = `\`zls.path\` ${zlsPath} is not a file`;
    }
  }

  if (message === null) {
    if (!zlsPath) {
      message = "Couldn't find Zig Language Server (ZLS) executable";
    } else if (!zlsPathExists) {
      message = `Couldn't find Zig Language Server (ZLS) executable at ${zlsPath}`;
    }
  }

  if (message) {
    const response = await window.showWarningMessage(message, "Install ZLS", "Specify Path");

    if (response === "Install ZLS") {
      return await installExecutable(context);
    } else if (response === "Specify Path") {
      const uris = await window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        title: "Select Zig Language Server (ZLS) executable",
      });

      if (uris) {
        await configuration.update("path", uris[0].path, true);
        return uris[0].path;
      }
    }
    return null;
  }

  return zlsPath;
}

async function openConfig(): Promise<void> {
  const configuration = workspace.getConfiguration("zls");
  const zlsPath = configuration.get("path", "zls");

  const process = child_process.spawn(zlsPath, ['--show-config-path']);
  process.stdout.on('data', async (data) => {
    const path: string = data.toString().trimEnd();
    vscode.window.showTextDocument(vscode.Uri.file(path), { preview: false });
  });
}

export function deactivate(): Thenable<void> {
  return stopClient();
}
