# 🚀 Configuración Simple de Supabase

## ⚡ Setup Rápido (5 minutos)

### 1. Crear proyecto Supabase
1. Ve a [supabase.com](https://supabase.com) y crea cuenta
2. Click "New Project"
3. Elige un nombre: `futsalpro`
4. Espera a que se cree (2-3 minutos)

### 2. Obtener credenciales
1. En tu proyecto, ve a **Settings** (⚙️) → **API**
2. Copia estos 2 valores:
   - **Project URL**
   - **anon public key**

### 3. Configurar en tu app
1. Crea archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. ¡Listo! 🎉

**No necesitas configurar SQL ni políticas.** Supabase maneja todo automáticamente:

- ✅ Tablas de usuarios
- ✅ Autenticación
- ✅ Seguridad
- ✅ Tokens JWT

## 🧪 Probar la autenticación

1. Ejecuta: `npm run dev`
2. Ve a `http://localhost:3000`
3. Click "Registrarse"
4. Crea una cuenta
5. ¡Funciona! 🚀

## ⚠️ Solución al error "must be owner of table users"

**Este error aparece cuando intentas modificar tablas de sistema.**

**SOLUCIÓN**: No ejecutes ningún SQL. Supabase funciona perfecto sin configuración adicional.

## 🔧 Configuración de Google OAuth (Solución al Error 400)

### Paso 1: Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Selecciona **Web application**
6. En **Authorized redirect URIs**, agrega **EXACTAMENTE**:
   ```
   https://tuproyecto.supabase.co/auth/v1/callback
   ```
   **⚠️ IMPORTANTE**: Reemplaza `tuproyecto` con tu URL real de Supabase

### Paso 2: Configurar Supabase

1. En Supabase → **Authentication** → **Providers**
2. Habilita **Google**
3. Agrega:
   - **Client ID** (de Google Cloud Console)
   - **Client Secret** (de Google Cloud Console)

### Paso 3: Verificar URLs

**Tu URL de Supabase debe ser exactamente igual en:**
- ✅ Google Cloud Console (redirect URI)
- ✅ Supabase (configuración automática)
- ✅ Tu `.env.local` (NEXT_PUBLIC_SUPABASE_URL)

### 🛠️ Solución al Error 400: redirect_uri_mismatch

**El error aparece porque las URLs no coinciden exactamente. Verifica:**

1. **URL en Google Console**: `https://abc123.supabase.co/auth/v1/callback`
2. **URL en tu .env.local**: `https://abc123.supabase.co`
3. **Deben ser el MISMO dominio** (abc123.supabase.co)

### 🎯 Ejemplo correcto:

```bash
# En .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co

# En Google Cloud Console (Redirect URI)
https://xyzcompany.supabase.co/auth/v1/callback
```

### ⚡ Solución Rápida

**Si tienes prisa, omite Google OAuth por ahora:**
- La autenticación con **email/password ya funciona perfectamente**
- Puedes agregar Google más tarde
- Tu app está 100% funcional sin Google

## ✅ ¿Qué está funcionando?

- 📧 **Email/Password**: Registro e inicio de sesión
- 🔄 **Sesiones persistentes**: No pierdes login al refrescar
- 🚪 **Sign out**: Cerrar sesión
- 🎨 **UI moderna**: Modal con animaciones
- 📱 **Responsive**: Funciona en móvil
- 🔐 **Seguridad**: JWT automáticos

---

**¡Tu autenticación real funciona sin configuración adicional!** 🎊