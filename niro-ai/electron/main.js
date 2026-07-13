const { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog, Notification } = require('electron')
const { spawn, execSync } = require('child_process')
const path = require('path')
const http = require('http')
const os = require('os')

// ── Chemins ──────────────────────────────────────────────────────────────────
const IS_PACKAGED = app.isPackaged
const RESOURCES = IS_PACKAGED ? process.resourcesPath : path.join(__dirname, '..')
const BACKEND_DIR = IS_PACKAGED
  ? path.join(RESOURCES, 'backend')
  : path.join(__dirname, '..', 'backend')

const PORT = 7777

// ── Globals ───────────────────────────────────────────────────────────────────
let mainWindow = null
let tray = null
let backendProcess = null
let ollamaProcess = null
let isReady = false

// ── Une seule instance ────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ── Démarrer Ollama ───────────────────────────────────────────────────────────
function startOllama () {
  try {
    execSync('pgrep -x ollama', { stdio: 'ignore' })
    console.log('✓ Ollama déjà actif')
    return
  } catch (e) {}

  console.log('🧠 Démarrage Ollama…')
  ollamaProcess = spawn('ollama', ['serve'], {
    detached: false,
    stdio: 'ignore',
    env: { ...process.env }
  })
  ollamaProcess.unref()
}

// ── Démarrer le backend Python ────────────────────────────────────────────────
function startBackend () {
  // IP locale
  const nets = os.networkInterfaces()
  let localIp = ''
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address
        break
      }
    }
    if (localIp) break
  }

  const env = {
    ...process.env,
    NIRO_LOCAL_IP: localIp,
    NIRO_PORT: String(PORT),
    PYTHONUNBUFFERED: '1',
  }

  // Chercher python3
  let python = 'python3'
  try { execSync('which python3', { stdio: 'ignore' }) } catch (e) {
    try { execSync('which python', { stdio: 'ignore' }); python = 'python' } catch (e2) {}
  }

  // Ajouter Homebrew au PATH si besoin
  const homebrewPaths = ['/opt/homebrew/bin', '/usr/local/bin']
  env.PATH = homebrewPaths.join(':') + ':' + (env.PATH || '')

  console.log(`🚀 Démarrage backend Python (${BACKEND_DIR})…`)
  backendProcess = spawn(
    python,
    ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(PORT)],
    { cwd: BACKEND_DIR, env, stdio: ['ignore', 'pipe', 'pipe'] }
  )

  backendProcess.stdout.on('data', d => console.log('[backend]', d.toString().trim()))
  backendProcess.stderr.on('data', d => {
    const msg = d.toString().trim()
    console.log('[backend]', msg)
    if (msg.includes('Application startup complete')) {
      isReady = true
      loadApp()
    }
  })

  backendProcess.on('exit', (code) => {
    console.log('Backend terminé (code', code, ')')
    if (!app.isQuitting) {
      setTimeout(startBackend, 3000) // relance automatique
    }
  })
}

// ── Attendre que le serveur réponde ──────────────────────────────────────────
function waitForServer (maxAttempts = 30, attempt = 0) {
  if (attempt >= maxAttempts) {
    dialog.showErrorBox('NIRO', 'Le serveur n\'a pas pu démarrer. Vérifiez que Python est installé.')
    return
  }
  http.get(`http://localhost:${PORT}/api/status`, (res) => {
    if (res.statusCode === 200) {
      isReady = true
      loadApp()
    } else {
      setTimeout(() => waitForServer(maxAttempts, attempt + 1), 1000)
    }
  }).on('error', () => {
    setTimeout(() => waitForServer(maxAttempts, attempt + 1), 1000)
  })
}

// ── Charger l'interface dans la fenêtre ──────────────────────────────────────
function loadApp () {
  if (!mainWindow) return
  mainWindow.loadURL(`http://localhost:${PORT}`)
}

// ── Créer la fenêtre principale ───────────────────────────────────────────────
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#010b14',
    titleBarStyle: 'hiddenInset',   // barre macOS transparente intégrée
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  })

  // Écran de chargement pendant que le backend démarre
  mainWindow.loadFile(path.join(__dirname, 'loading.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()        // ← réduit dans le dock au lieu de fermer
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)   // liens externes → navigateur système
    return { action: 'deny' }
  })
}

// ── Tray (icône barre de menus) ───────────────────────────────────────────────
function createTray () {
  // Icône simple 22×22 en template (s'adapte clair/sombre)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const menu = Menu.buildFromTemplate([
    { label: 'Ouvrir NIRO', click: () => { mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    {
      label: 'Accès réseau local',
      submenu: [
        { label: 'Copier l\'URL locale', click: copyLocalUrl },
        { label: 'Ouvrir dans Safari', click: () => shell.openExternal(`http://localhost:${PORT}`) },
      ]
    },
    { type: 'separator' },
    { label: 'Quitter NIRO', click: () => { app.isQuitting = true; app.quit() } },
  ])

  tray.setContextMenu(menu)
  tray.setToolTip('NIRO — Assistant IA')
  tray.on('click', () => { mainWindow.show(); mainWindow.focus() })
}

function copyLocalUrl () {
  const nets = os.networkInterfaces()
  let ip = 'localhost'
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { ip = net.address; break }
    }
  }
  require('electron').clipboard.writeText(`http://${ip}:${PORT}`)
  new Notification({ title: 'NIRO', body: `URL copiée : http://${ip}:${PORT}` }).show()
}

// ── Cycle de vie app ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // macOS : ne pas afficher dans le Dock quand en tray-only
  // app.dock.hide()   // ← décommentez si vous voulez mode menu bar only

  createWindow()
  createTray()
  startOllama()
  startBackend()

  // Fallback : si le backend ne signale pas "startup complete", on poll
  setTimeout(() => {
    if (!isReady) waitForServer()
  }, 5000)
})

app.on('activate', () => {
  // Clic sur l'icône Dock
  if (mainWindow) { mainWindow.show(); mainWindow.focus() }
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (backendProcess) backendProcess.kill()
  if (ollamaProcess) { try { ollamaProcess.kill() } catch(e){} }
})

// Empêcher la fermeture complète sur macOS
app.on('window-all-closed', (e) => {
  // Ne pas quitter — on reste dans la barre de menus
})
