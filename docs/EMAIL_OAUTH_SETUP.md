# Configuración de OAuth para Email (Gmail y Outlook)

Esta guía explica cómo configurar las conexiones OAuth para que los usuarios puedan conectar sus cuentas de Gmail y Outlook para enviar campañas de email.

---

## 📧 Configuración de Gmail (Google)

### Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos (arriba a la izquierda)
3. Clic en **"Nuevo Proyecto"**
4. Nombre: `Whahook Email` (o el que prefieras)
5. Clic en **"Crear"**

### Paso 2: Habilitar Gmail API

1. En el menú lateral, ve a **APIs y servicios → Biblioteca**
2. Busca **"Gmail API"**
3. Haz clic en **"Gmail API"**
4. Clic en **"Habilitar"**

### Paso 3: Configurar pantalla de consentimiento OAuth

1. Ve a **APIs y servicios → Pantalla de consentimiento OAuth**
2. Selecciona **"Externo"** y clic en **"Crear"**
3. Completa:
   - **Nombre de la aplicación**: `Whahook`
   - **Correo de asistencia**: tu email
   - **Logotipo**: (opcional) sube el logo de Whahook
   - **Dominios autorizados**: añade `whahook.com` (tu dominio)
   - **Correo del desarrollador**: tu email
4. Clic en **"Guardar y continuar"**

### Paso 4: Añadir scopes (permisos)

1. Clic en **"Añadir o quitar ámbitos"**
2. Busca y selecciona:
   - `https://www.googleapis.com/auth/gmail.send` (Enviar emails)
   - `https://www.googleapis.com/auth/userinfo.email` (Ver email del usuario)
3. Clic en **"Actualizar"** y luego **"Guardar y continuar"**

### Paso 5: Añadir usuarios de prueba (mientras está en desarrollo)

1. Clic en **"Add users"**
2. Añade los emails de las personas que probarán la app
3. Clic en **"Guardar y continuar"**

> ⚠️ **Nota**: Mientras la app esté en modo "Testing", solo los usuarios añadidos aquí podrán conectar Gmail. Para producción, necesitas verificar la app con Google.

### Paso 6: Crear credenciales OAuth

1. Ve a **APIs y servicios → Credenciales**
2. Clic en **"Crear credenciales" → "ID de cliente OAuth"**
3. Tipo de aplicación: **"Aplicación web"**
4. Nombre: `Whahook Web Client`
5. **Orígenes autorizados de JavaScript**:
   ```
   https://whahook.com
   https://www.whahook.com
   http://localhost:3000
   ```
6. **URIs de redirección autorizados**:
   ```
   https://whahook2-production.up.railway.app/api/email/oauth/gmail/callback
   http://localhost:3001/api/email/oauth/gmail/callback
   ```
7. Clic en **"Crear"**

### Paso 7: Copiar credenciales

Después de crear, verás una ventana con:
- **ID de cliente**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Secreto de cliente**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

**¡Guarda estos valores!**

---

## 📨 Configuración de Outlook (Microsoft)

### Paso 1: Registrar aplicación en Azure

1. Ve a [Azure Portal](https://portal.azure.com/)
2. Busca **"Registros de aplicaciones"** (App registrations)
3. Clic en **"Nuevo registro"**
4. Completa:
   - **Nombre**: `Whahook Email`
   - **Tipos de cuenta compatibles**: "Cuentas en cualquier directorio organizativo y cuentas Microsoft personales"
   - **URI de redirección**: 
     - Plataforma: `Web`
     - URL: `https://whahook2-production.up.railway.app/api/email/oauth/outlook/callback`
5. Clic en **"Registrar"**

### Paso 2: Copiar ID de aplicación

En la página de la aplicación registrada, copia:
- **Id. de aplicación (cliente)**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Paso 3: Crear secreto de cliente

1. En el menú lateral, ve a **"Certificados y secretos"**
2. Clic en **"Nuevo secreto de cliente"**
3. Descripción: `Whahook Production`
4. Expiración: elige según tu preferencia (recomendado: 24 meses)
5. Clic en **"Agregar"**
6. **¡IMPORTANTE!** Copia el **Valor** del secreto inmediatamente (solo se muestra una vez)

### Paso 4: Configurar permisos de API

1. En el menú lateral, ve a **"Permisos de API"**
2. Clic en **"Agregar un permiso"**
3. Selecciona **"Microsoft Graph"**
4. Selecciona **"Permisos delegados"**
5. Busca y selecciona:
   - `Mail.Send` (Enviar correo como el usuario)
   - `User.Read` (Leer perfil del usuario)
   - `offline_access` (Mantener acceso a los datos)
6. Clic en **"Agregar permisos"**

### Paso 5: (Opcional) Conceder consentimiento del administrador

Si tienes permisos de administrador:
1. Clic en **"Conceder consentimiento del administrador para [tu organización]"**
2. Confirma

---

## 🔧 Variables de Entorno en Railway

### Paso 1: Ir a Railway

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Selecciona tu proyecto **whahook2**
3. Clic en el servicio del **backend**
4. Ve a la pestaña **"Variables"**

### Paso 2: Añadir variables de Gmail

Clic en **"New Variable"** y añade:

| Variable | Valor |
|----------|-------|
| `GOOGLE_CLIENT_ID` | `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx` |

### Paso 3: Añadir variables de Outlook

| Variable | Valor |
|----------|-------|
| `MICROSOFT_CLIENT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MICROSOFT_CLIENT_SECRET` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

### Paso 4: Verificar variable BACKEND_URL

Asegúrate de que existe:

| Variable | Valor |
|----------|-------|
| `BACKEND_URL` | `https://whahook2-production.up.railway.app` |
| `FRONTEND_URL` | `https://whahook.com` |

### Paso 5: Redesplegar

Después de añadir las variables, Railway redesplegará automáticamente. Si no:
1. Ve a **"Deployments"**
2. Clic en **"Redeploy"** en el último deployment

---

## ✅ Verificación

### Probar Gmail:
1. Ve a tu app → Configuración → Conexiones → Email
2. Clic en **"Gmail"**
3. Debería redirigirte a Google para autorizar
4. Después de autorizar, volverás a la app con el email conectado

### Probar Outlook:
1. Ve a tu app → Configuración → Conexiones → Email
2. Clic en **"Outlook"**
3. Debería redirigirte a Microsoft para autorizar
4. Después de autorizar, volverás a la app con el email conectado

---

## 🚨 Solución de Problemas

### Error: "OAuth not configured"
- Verifica que las variables de entorno estén correctamente configuradas en Railway
- Asegúrate de que no hay espacios extra en los valores

### Error: "redirect_uri_mismatch" (Google)
- Ve a Google Cloud Console → Credenciales
- Edita tu cliente OAuth
- Verifica que la URI de redirección sea exactamente:
  ```
  https://whahook2-production.up.railway.app/api/email/oauth/gmail/callback
  ```

### Error: "AADSTS50011" (Microsoft)
- Ve a Azure Portal → Tu app → Autenticación
- Verifica que la URI de redirección sea exactamente:
  ```
  https://whahook2-production.up.railway.app/api/email/oauth/outlook/callback
  ```

### Error: "Access blocked: App not verified" (Google)
- Tu app está en modo de prueba
- Añade los usuarios de prueba en la pantalla de consentimiento OAuth
- O solicita verificación de la app a Google (proceso largo)

---

## 📋 Resumen de Variables

```env
# Gmail OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx

# Outlook OAuth
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URLs (probablemente ya las tienes)
BACKEND_URL=https://whahook2-production.up.railway.app
FRONTEND_URL=https://whahook.com
```

---

## 🔒 Seguridad

- **Nunca** compartas los secretos de cliente
- **Nunca** los subas a Git (están en .env o variables de Railway)
- Rota los secretos periódicamente
- Usa secretos diferentes para desarrollo y producción
