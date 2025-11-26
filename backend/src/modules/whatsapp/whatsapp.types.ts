import { Client } from 'whatsapp-web.js'

/**
 * Estados posibles de una sesión WhatsApp
 */
export type SessionStatus = 
  | 'initializing'    // Creando cliente
  | 'qr_pending'      // Esperando escaneo QR
  | 'authenticating'  // Autenticando
  | 'ready'           // Conectado y listo
  | 'disconnected'    // Desconectado
  | 'error'           // Error

/**
 * Datos de una sesión en memoria
 */
export interface WhatsAppSession {
  client: Client
  status: SessionStatus
  userId: string
  sessionId: string
  phoneNumber?: string
  lastActivity: number
  createdAt: number
  reconnectAttempts: number
}

/**
 * Datos de cuenta WhatsApp en Supabase
 */
export interface WhatsAppAccount {
  id: string
  user_id: string
  session_id: string
  phone_number: string | null
  status: SessionStatus
  error_message: string | null
  last_seen: string
  created_at: string
  updated_at: string
}

/**
 * Eventos Socket.IO para WhatsApp
 */
export interface WhatsAppSocketEvents {
  // Cliente → Servidor
  'whatsapp:connect': { userId: string }
  'whatsapp:disconnect': { sessionId: string }
  'whatsapp:status': { sessionId: string }
  
  // Servidor → Cliente
  'whatsapp:qr': { qr: string; sessionId: string }
  'whatsapp:ready': { sessionId: string; phoneNumber: string }
  'whatsapp:disconnected': { sessionId: string; reason: string }
  'whatsapp:error': { sessionId: string; error: string }
  'whatsapp:status_update': { sessionId: string; status: SessionStatus }
}

/**
 * Configuración de límites
 */
export const LIMITS = {
  maxSessionsPerUser: 1,          // 1 WhatsApp por usuario
  maxReconnectAttempts: 3,        // Intentos de reconexión
  reconnectDelayMs: 5000,         // Delay entre intentos
  qrTimeoutMs: 60000,             // Timeout para escanear QR (1 min)
  sessionInactivityMs: 5 * 60 * 1000, // 5 minutos sin actividad
}

/**
 * Configuración de keepalive
 */
export const KEEPALIVE_CONFIG = {
  heartbeatIntervalMs: 2 * 60 * 1000,      // 2 minutos
  watchdogIntervalMs: 60 * 1000,           // 1 minuto
  browserActivityIntervalMs: 45 * 1000,    // 45 segundos
  keepaliveMessageMinMs: 165 * 60 * 1000,  // 2h 45min (165 min)
  keepaliveMessageMaxMs: 195 * 60 * 1000,  // 3h 15min (195 min)
}
