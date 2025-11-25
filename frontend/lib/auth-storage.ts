/**
 * Auth Storage Helper
 * Maneja el almacenamiento de tokens según la preferencia de "Remember Me"
 */

export type StorageType = 'localStorage' | 'sessionStorage'

export class AuthStorage {
  /**
   * Obtener el storage apropiado
   */
  private static getStorage(rememberMe: boolean): Storage {
    return rememberMe ? localStorage : sessionStorage
  }

  /**
   * Guardar sesión de autenticación
   */
  static saveSession(
    accessToken: string,
    refreshToken: string,
    user: Record<string, unknown> | null,
    rememberMe: boolean = false
  ): void {
    const storage = this.getStorage(rememberMe)
    
    storage.setItem('access_token', accessToken)
    storage.setItem('refresh_token', refreshToken)
    storage.setItem('user', JSON.stringify(user))
    storage.setItem('remember_me', rememberMe.toString())
    storage.setItem('session_expires_at', this.calculateExpiryTime(rememberMe))
  }

  /**
   * Obtener token de acceso
   */
  static getAccessToken(): string | null {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  }

  /**
   * Obtener refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
  }

  /**
   * Obtener usuario
   */
  static getUser(): Record<string, unknown> | null {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  /**
   * Verificar si la sesión está activa
   */
  static isSessionActive(): boolean {
    const token = this.getAccessToken()
    if (!token) return false

    const expiresAt = localStorage.getItem('session_expires_at') || 
                      sessionStorage.getItem('session_expires_at')
    
    if (!expiresAt) return false

    return new Date().getTime() < parseInt(expiresAt)
  }

  /**
   * Verificar si el usuario eligió "Remember Me"
   */
  static hasRememberMe(): boolean {
    const rememberMe = localStorage.getItem('remember_me') || 
                       sessionStorage.getItem('remember_me')
    return rememberMe === 'true'
  }

  /**
   * Limpiar sesión (logout)
   */
  static clearSession(): void {
    // Limpiar de ambos storages
    const keys = ['access_token', 'refresh_token', 'user', 'remember_me', 'session_expires_at']
    
    keys.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
  }

  /**
   * Actualizar access token (después de refresh)
   */
  static updateAccessToken(accessToken: string): void {
    const rememberMe = this.hasRememberMe()
    const storage = this.getStorage(rememberMe)
    storage.setItem('access_token', accessToken)
  }

  /**
   * Calcular tiempo de expiración
   * Remember Me: 30 días
   * Session: 24 horas
   */
  private static calculateExpiryTime(rememberMe: boolean): string {
    const now = new Date().getTime()
    const expiryMs = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 días
      : 24 * 60 * 60 * 1000        // 24 horas
    
    return (now + expiryMs).toString()
  }

  /**
   * Migrar sesión de sessionStorage a localStorage
   * Útil si el usuario marca "Remember Me" después de login
   */
  static migrateToLocalStorage(): void {
    const keys = ['access_token', 'refresh_token', 'user', 'session_expires_at']
    
    keys.forEach(key => {
      const value = sessionStorage.getItem(key)
      if (value) {
        localStorage.setItem(key, value)
        sessionStorage.removeItem(key)
      }
    })
    
    localStorage.setItem('remember_me', 'true')
  }

  /**
   * Migrar sesión de localStorage a sessionStorage
   * Útil si el usuario desmarca "Remember Me"
   */
  static migrateToSessionStorage(): void {
    const keys = ['access_token', 'refresh_token', 'user', 'session_expires_at']
    
    keys.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        sessionStorage.setItem(key, value)
        localStorage.removeItem(key)
      }
    })
    
    sessionStorage.setItem('remember_me', 'false')
    localStorage.removeItem('remember_me')
  }
}
