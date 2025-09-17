const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require("electron-updater");
const CONFIG_PATH = path.join(__dirname, 'config', 'download-config.json');
const fs = require('fs').promises;

// Verifica se está em desenvolvimento
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';

let mainWindow;
let serverProcess = null; // Variável para controlar o processo do servidor

// Handler para salvar configurações
ipcMain.handle('salvar-configuracoes', async (event, configuracoes) => {
    try {
        // Garantir que a pasta config existe
        const configDir = path.dirname(CONFIG_PATH);
        try {
            await fs.access(configDir);
        } catch (error) {
            await fs.mkdir(configDir, { recursive: true });
        }

        // Salvar configurações
        await fs.writeFile(CONFIG_PATH, JSON.stringify(configuracoes, null, 2), 'utf8');

        console.log('✅ Configurações salvas (Electron):', configuracoes);

        return {
            success: true,
            message: 'Configurações salvas com sucesso'
        };

    } catch (error) {
        console.error('❌ Erro ao salvar configurações (Electron):', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Handler para carregar configurações
ipcMain.handle('carregar-configuracoes', async (event) => {
    try {
        await fs.access(CONFIG_PATH);
        const dadosArquivo = await fs.readFile(CONFIG_PATH, 'utf8');
        const configuracoes = JSON.parse(dadosArquivo);

        console.log('✅ Configurações carregadas (Electron):', configuracoes);

        return {
            success: true,
            configuracoes: configuracoes
        };

    } catch (error) {
        console.log('⚠️ Arquivo de configurações não encontrado (Electron), usando padrões');

        const configPadrao = {
            padraoNomeacao: 'empresa-ano-mes',
            pastaDestino: './downloads',
            notificarDownloads: true,
            notificarErros: true,
            extrairZip: true,
            manterZip: false
        };

        return {
            success: true,
            configuracoes: configPadrao
        };
    }
});

// Handler para selecionar pasta
ipcMain.handle('selecionar-pasta', async (event) => {
    try {
        const result = await dialog.showOpenDialog({
            title: 'Selecionar pasta de destino',
            properties: ['openDirectory'],
            defaultPath: './downloads'
        });

        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
            return {
                success: false,
                canceled: true
            };
        }

        const caminhoSelecionado = result.filePaths[0];

        return {
            success: true,
            caminho: caminhoSelecionado
        };

    } catch (error) {
        console.error('❌ Erro ao selecionar pasta (Electron):', error);
        return {
            success: false,
            error: error.message
        };
    }
});

function startServer() {
    if (serverProcess) {
        console.log('Servidor já está rodando...');
        return;
    }

    if (isDev) {
        console.log("🚀 Iniciando servidor Node.js (spawn em dev)...");
        serverProcess = spawn('node', ['server.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });

        serverProcess.stdout.on('data', (data) => {
            console.log(`[SERVER] ${data.toString().trim()}`);
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`[SERVER ERROR] ${data.toString().trim()}`);
        });

        serverProcess.on('close', (code) => {
            console.log(`[SERVER] Processo encerrado com código: ${code}`);
            serverProcess = null;
        });

        serverProcess.on('error', (err) => {
            console.error('❌ Erro ao iniciar server.js:', err);
            serverProcess = null;
        });

    } else {
        try {
            console.log("🚀 Iniciando servidor Node.js (require em produção)...");
            require(path.join(__dirname, 'server.js'));
            console.log("✅ Server.js carregado no processo principal");
        } catch (err) {
            console.error("❌ Erro ao iniciar server.js:", err);
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false
        },
        icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        show: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        startServer();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.protocol === 'file:') {
            return;
        }

        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            event.preventDefault();
            console.log(`Navegação bloqueada para: ${navigationUrl}`);
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        const { shell } = require('electron');

        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }

        return { action: 'allow' };
    });
}

/* ----------------------------
   CONFIGURAÇÃO DO AUTOUPDATER
----------------------------- */
function configurarAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false; // só instala se usuário aceitar

    autoUpdater.on("update-available", (info) => {
        console.log(`⬇️ Atualização disponível: ${info.version}`);
        if (mainWindow) {
            mainWindow.webContents.send("update-available", info);
        }
    });

    autoUpdater.on("update-downloaded", (info) => {
        console.log("✅ Atualização baixada e pronta.");
        if (mainWindow) {
            mainWindow.webContents.send("update-downloaded", info);
        }
    });

    autoUpdater.on("error", (err) => {
        console.error("❌ Erro no update:", err);
        if (mainWindow) {
            mainWindow.webContents.send("update-error", err.message);
        }
    });
}

// IPC chamado quando usuário entra no dashboard
ipcMain.handle("check-for-updates", () => {
    autoUpdater.checkForUpdates();
});

// IPC chamado quando usuário aceita atualizar
ipcMain.handle("install-update", async () => {
    console.log("🚀 Usuário aceitou atualização, fechando app...");
    if (serverProcess) {
        serverProcess.kill("SIGTERM");
        serverProcess = null;
    }
    setTimeout(() => {
        autoUpdater.quitAndInstall(false, true);
    }, 1000);
});

// Após instalar, notificação do sistema
autoUpdater.on("update-downloaded", () => {
    new Notification({
        title: "GbSoft Desktop",
        body: "Atualização concluída! Abra novamente o app."
    }).show();
});

app.whenReady().then(() => {
    createWindow();
    configurarAutoUpdater();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

app.on('window-all-closed', () => {
    if (isDev && serverProcess) {
        console.log('🛑 Encerrando servidor (dev)...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (isDev && serverProcess) {
        console.log('🛑 Encerrando servidor antes de sair (dev)...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
});

ipcMain.handle('navigate-to', async (event, page) => {
    try {
        const allowedPages = ['index.html', 'dashboard.html'];

        if (allowedPages.includes(page)) {
            console.log(`Navegando via IPC para: ${page}`);
            await mainWindow.loadFile(page);
            return { success: true };
        } else {
            throw new Error(`Página não permitida: ${page}`);
        }
    } catch (error) {
        console.error('Erro na navegação:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('check-server-status', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/status');
        return { running: true, status: await response.json() };
    } catch (error) {
        return { running: false, error: error.message };
    }
});

ipcMain.handle('restart-server', () => {
    if (isDev && serverProcess) {
        serverProcess.kill('SIGTERM');
        serverProcess = null;
        setTimeout(startServer, 1000);
    }
    return { success: true };
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

ipcMain.handle('reload-window', () => {
    if (mainWindow) {
        mainWindow.reload();
    }
});

process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Promise rejeitada não tratada:', reason);
});

console.log(`Aplicacao iniciada em modo ${isDev ? 'desenvolvimento' : 'producao'}`);
