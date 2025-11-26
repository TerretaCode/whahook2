import { env, isProd } from './environment'

/**
 * Configuración optimizada de Puppeteer para Railway
 * Reduce consumo de RAM de ~150MB a ~60-80MB por sesión
 */
export const PUPPETEER_CONFIG = {
  headless: true as const, // Modo headless
  timeout: 0, // No timeout for browser operations
  protocolTimeout: 240000, // 4 minutes for protocol operations
  
  // Executable path (en producción usa Chromium de nixpacks)
  ...(env.puppeteerExecutablePath && {
    executablePath: env.puppeteerExecutablePath
  }),
  
  args: [
    // === CRÍTICOS PARA RAILWAY (sin X server) ===
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-accelerated-2d-canvas',
    '--headless=new',
    '--single-process',
    
    // === FIX PARA SERVIDOR SIN DISPLAY ===
    '--disable-features=VizDisplayCompositor',
    '--use-gl=swiftshader',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    
    // === FIX PARA LOCKS DE PERFIL ===
    '--disable-features=LockProfileCookieDatabase',
    '--disable-session-crashed-bubble',
    '--disable-infobars',
    
    // === ESTABILIDAD ===
    '--no-first-run',
    '--no-zygote',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--safebrowsing-disable-auto-update',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
  ],
}

// Configuración para desarrollo local (Windows)
// Usa Chromium de Puppeteer (no Chrome del sistema)
export const PUPPETEER_CONFIG_DEV = {
  headless: false, // Visible para debug
  // NO especificar executablePath - usar Chromium de Puppeteer
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
}

// Exportar la configuración según el entorno
export const getPuppeteerConfig = () => isProd ? PUPPETEER_CONFIG : PUPPETEER_CONFIG_DEV
