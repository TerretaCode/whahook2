import { env, isProd } from './environment'

/**
 * Configuración optimizada de Puppeteer para Railway
 * Reduce consumo de RAM de ~150MB a ~60-80MB por sesión
 */
export const PUPPETEER_CONFIG = {
  headless: true,
  
  // Executable path (en producción usa Chromium de nixpacks)
  ...(env.puppeteerExecutablePath && {
    executablePath: env.puppeteerExecutablePath
  }),
  
  args: [
    // === CRÍTICOS PARA RAILWAY ===
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-accelerated-2d-canvas',
    
    // === REDUCCIÓN DE MEMORIA ===
    '--single-process',
    '--no-zygote',
    '--disable-features=site-per-process',
    '--js-flags=--max-old-space-size=128',
    '--renderer-process-limit=1',
    '--disable-canvas-aa',
    '--disable-2d-canvas-clip-aa',
    
    // === DESACTIVAR FEATURES INNECESARIAS ===
    '--no-first-run',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-features=TranslateUI',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--disable-translate',
    
    // === CACHE DESACTIVADO ===
    '--disk-cache-size=0',
    '--media-cache-size=0',
    '--aggressive-cache-discard',
    
    // === OTROS ===
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
  ],
  
  // Timeouts
  timeout: 60000,
  protocolTimeout: 300000,
  
  // Ignorar errores HTTPS
  ignoreHTTPSErrors: true,
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
export const getPuppeteerConfig = () => {
  const config = isProd ? PUPPETEER_CONFIG : PUPPETEER_CONFIG_DEV
  console.log(`🔧 Using Puppeteer config: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`)
  return config
}
