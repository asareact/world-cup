# 🚀 Configuración de Supabase para FutsalPro

## Pasos para configurar la autenticación

### 1. Crear cuenta en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto

### 2. Obtener las credenciales
1. En tu dashboard de Supabase, ve a **Settings > API**
2. Copia el **Project URL**
3. Copia la **anon public key**

### 3. Configurar variables de entorno
1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las siguientes variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_del_proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_anonima
```

### 4. Configurar autenticación con Google (opcional)
1. En Supabase, ve a **Authentication > Providers**
2. Habilita **Google**
3. Configura las credenciales de Google OAuth:
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un proyecto nuevo
   - Habilita Google+ API
   - Crea credenciales OAuth 2.0
   - Agrega `https://tu-proyecto.supabase.co/auth/v1/callback` como URI de redirección
   - Copia Client ID y Client Secret a Supabase

### 5. Configurar políticas de seguridad (RLS)

**IMPORTANTE**: NO necesitas configurar RLS en `auth.users` manualmente. Supabase ya maneja esto automáticamente.

Si quieres crear tablas personalizadas para perfiles de usuario, usa este SQL:

```sql
-- Crear tabla de perfiles públicos (opcional)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Habilitar RLS en la tabla profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver perfiles públicos
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🎯 Funcionalidades implementadas

✅ **Registro de usuarios** con email/password
✅ **Inicio de sesión** con email/password  
✅ **Autenticación con Google** (opcional)
✅ **Cierre de sesión**
✅ **Persistencia de sesión**
✅ **Validación de formularios**
✅ **Manejo de errores**
✅ **UI moderna y responsive**

## 🔧 Desarrollo local

1. Asegúrate de tener las variables de entorno configuradas
2. Ejecuta: `npm run dev`
3. La autenticación funcionará inmediatamente

## 📱 Uso de la autenticación

- **Botón "Ingresar"**: Abre modal de inicio de sesión
- **Botón "Registrarse"**: Abre modal de registro
- **Avatar del usuario**: Muestra nombre/email cuando está logueado
- **Botón "Salir"**: Cierra sesión

## 🔐 Seguridad

- ✅ Tokens JWT automáticos
- ✅ Refresh tokens
- ✅ Políticas de seguridad RLS
- ✅ Validación de email
- ✅ Encriptación de contraseñas

## 🚀 Listo para producción

La implementación está lista para producción y escala automáticamente con Supabase.

---

**¡Tu autenticación real está lista! 🎉**