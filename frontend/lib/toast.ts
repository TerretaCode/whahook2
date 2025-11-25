import { toast as sonnerToast } from "sonner"

/**
 * Helper para notificaciones toast
 * Wrapper sobre Sonner con configuración predeterminada
 */
export const toast = {
  /**
   * Toast de éxito
   */
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Toast de error
   */
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000,
    })
  },

  /**
   * Toast de advertencia
   */
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Toast informativo
   */
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Toast de carga
   * Retorna el ID para poder actualizarlo después
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },

  /**
   * Toast para promesas
   * Muestra loading, success o error automáticamente
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },

  /**
   * Actualizar un toast existente
   */
  update: (
    id: string | number,
    type: "success" | "error" | "warning" | "info",
    message: string,
    description?: string
  ) => {
    const toastFn = sonnerToast[type]
    toastFn(message, {
      id,
      description,
    })
  },

  /**
   * Cerrar un toast específico
   */
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id)
  },

  /**
   * Toast personalizado
   */
  custom: (jsx: (id: string | number) => React.ReactElement) => {
    sonnerToast.custom(jsx)
  },
}

/**
 * Toasts específicos para la aplicación
 */
export const appToast = {
  /**
   * Login successful
   */
  loginSuccess: () => {
    toast.success("Logged in", "Welcome back")
  },

  /**
   * Logout successful
   */
  logoutSuccess: () => {
    toast.info("Logged out", "See you soon")
  },

  /**
   * Authentication error
   */
  authError: () => {
    toast.error("Authentication error", "Please log in again")
  },

  /**
   * Saved successfully
   */
  saved: () => {
    toast.success("Saved", "Changes saved successfully")
  },

  /**
   * Save error
   */
  saveError: () => {
    toast.error("Save error", "Could not save changes")
  },

  /**
   * API Key saved
   */
  apiKeySaved: () => {
    toast.success("API Key saved", "Your key was saved securely")
  },

  /**
   * API Key deleted
   */
  apiKeyDeleted: () => {
    toast.info("API Key deleted", "Key was deleted successfully")
  },

  /**
   * WhatsApp connected
   */
  whatsappConnected: () => {
    toast.success("WhatsApp connected", "Your account is ready to use")
  },

  /**
   * WhatsApp disconnected
   */
  whatsappDisconnected: () => {
    toast.warning("WhatsApp disconnected", "Reconnect your account to continue")
  },

  /**
   * Message sent
   */
  messageSent: () => {
    toast.success("Message sent", "Message sent successfully")
  },

  /**
   * Message send error
   */
  messageSendError: () => {
    toast.error("Send error", "Could not send message")
  },

  /**
   * Copied to clipboard
   */
  copied: () => {
    toast.success("Copied", "Copied to clipboard")
  },

  /**
   * Generic error
   */
  genericError: () => {
    toast.error("Error", "Something went wrong. Try again")
  },

  /**
   * Operation in progress
   */
  loading: (message: string = "Loading...") => {
    return toast.loading(message)
  },
}
