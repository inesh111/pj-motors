// electron-main.js
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let nextProcess = null;

const PORT = 3000;

function getAppRoot() {
  // In dev, __dirname is project root.
  // In prod (asar disabled), app.getAppPath() is the app root under Resources/app
  return app.isPackaged ? app.getAppPath() : __dirname;
}

// Start Next.js server in production (packaged app)
function startNextServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;

    // In dev, we already run "next dev" via npm run dev:desktop
    if (isDev) {
      resolve();
      return;
    }

    const appRoot = getAppRoot();

    const nextBin = path.join(
      appRoot,
      'node_modules',
      'next',
      'dist',
      'bin',
      'next'
    );

    nextProcess = spawn(
      process.execPath,
      [nextBin, 'start', '-p', String(PORT)],
      {
        cwd: appRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
        stdio: 'inherit',
      }
    );

    nextProcess.on('error', (err) => {
      console.error('Failed to start Next.js server:', err);
      reject(err);
    });

    // Poll until server responds
    const startTime = Date.now();
    const timeoutMs = 20000;

    function checkServer() {
      http
        .get(`http://localhost:${PORT}`, (res) => {
          res.destroy();
          resolve();
        })
        .on('error', () => {
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Next.js server failed to start in time'));
          } else {
            setTimeout(checkServer, 500);
          }
        });
    }

    setTimeout(checkServer, 1000);
  });
}

function createWindow() {
  const appRoot = getAppRoot();
  const iconPath = path.join(appRoot, 'electron-assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'PJ Motors',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const appRoot = getAppRoot();
  const iconPath = path.join(appRoot, 'electron-assets', 'icon.png');

  if (process.platform === 'darwin') {
    try {
      app.dock.setIcon(iconPath);
    } catch (err) {
      console.error('Failed to set dock icon:', err);
    }
  }

  try {
    await startNextServer();
  } catch (err) {
    console.error('Error starting Next.js server:', err);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});