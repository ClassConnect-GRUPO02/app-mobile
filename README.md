# ClassConnect 📚

ClassConnect es una aplicación móvil educativa desarrollada con React Native y Expo que permite la gestión completa de cursos, tareas, estudiantes e instructores. Es una plataforma integral para la educación que incluye funcionalidades de chat, estadísticas, notificaciones y gestión de recursos.

## 🚀 Características Principales

### Para Estudiantes
- **Exploración de Cursos**: Buscar y explorar cursos disponibles
- **Gestión de Tareas**: Ver, completar y entregar tareas asignadas
- **Chat de Asistencia**: Comunicación directa con instructores
- **Perfil Personal**: Gestión de información personal y configuraciones
- **Favoritos**: Marcar cursos como favoritos para acceso rápido
- **Notificaciones**: Recibir alertas sobre nuevas tareas, mensajes y actualizaciones

### Para Instructores
- **Creación de Cursos**: Crear y gestionar cursos completos
- **Gestión de Módulos**: Organizar contenido en módulos estructurados
- **Administración de Tareas**: Crear, asignar y evaluar tareas
- **Gestión de Recursos**: Subir y organizar materiales de estudio
- **Estadísticas**: Ver métricas de progreso de estudiantes
- **Sistema de Retroalimentación**: Proporcionar feedback detallado a estudiantes

### Características Técnicas
- **Autenticación**: Login seguro con Firebase Authentication y Google Sign-In
- **Base de Datos**: Supabase para almacenamiento de datos
- **Almacenamiento**: Supabase Storage para archivos y recursos
- **Notificaciones Push**: Sistema completo de notificaciones en tiempo real
- **Interfaz Moderna**: Diseño Material Design con React Native Paper
- **Navegación**: Expo Router con file-based routing
- **Soporte Multimedia**: Visualización de documentos, imágenes y videos

## 📋 Requisitos Previos

### Software Necesario
1. **Node.js** (versión 18 o superior)
   ```bash
   node --version
   npm --version
   ```

2. **Android Studio** con Android SDK
   - Descargar desde: https://developer.android.com/studio
   - Configurar Android SDK (API 33 o superior recomendado)
   - Configurar variables de entorno ANDROID_HOME

3. **Java Development Kit (JDK)** (versión 11 o superior)

4. **Git** para control de versiones

### Configuración del Emulador Android

1. **Instalar Android Studio** y abrir AVD Manager
2. **Crear un Virtual Device:**
   - Seleccionar un dispositivo (recomendado: Pixel 4 o superior)
   - Elegir una System Image (API 33/Android 13 recomendado)
   - Configurar el AVD con al menos 4GB de RAM
   - Habilitar hardware acceleration

3. **Iniciar el emulador** antes de ejecutar la aplicación

### Variables de Entorno (Windows)
```bash
# Agregar al PATH del sistema
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\%USERNAME%\AppData\Local\Android\Sdk

# Agregar al PATH
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

## 🛠️ Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd app-mobile
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configuración de Firebase
La aplicación ya incluye la configuración de Firebase, pero asegúrate de que el archivo `google-services.json` esté presente en la raíz del proyecto.

### 4. Configuración de Supabase
Las configuraciones de Supabase están incluidas en `api/supabaseClient.ts`. La aplicación se conecta automáticamente a la instancia configurada.

## 🚀 Ejecutar la Aplicación

### Opción 1: Desarrollo con Expo (Recomendado)
```bash
# Iniciar el servidor de desarrollo
npx expo start

# Desde el terminal interactivo, presionar 'a' para abrir en Android
```

### Opción 2: Build y Ejecutar en Android (Recomendado para Testing)
```bash
# Asegúrate de que el emulador Android esté ejecutándose
# Verificar dispositivos disponibles
adb devices

# Ejecutar en Android
npx expo run:android
```

### Comandos Disponibles
```bash
# Desarrollo general
npm start                # Iniciar servidor Expo
npm run android         # Ejecutar en Android
npm run ios            # Ejecutar en iOS (requiere macOS)
npm run web            # Ejecutar en navegador web

# Testing y calidad de código
npm test               # Ejecutar tests
npm run lint          # Linting del código

# Utilidades
npm run reset-project  # Reiniciar proyecto (limpio)
```

## 🔧 Solución de Problemas Comunes

### Error: "Unable to locate adb"
```bash
# Verificar que ANDROID_HOME esté configurado
echo $ANDROID_HOME

# Agregar platform-tools al PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Error: "No connected devices"
1. Verificar que el emulador esté ejecutándose
2. Ejecutar `adb devices` para confirmar la conexión
3. Si es necesario, reiniciar adb: `adb kill-server && adb start-server`

### Error de compilación Android
```bash
# Limpiar cache de Expo
npx expo start --clear

# Limpiar build de Android
cd android && ./gradlew clean && cd ..
```

### Problemas de permisos de red
La aplicación incluye configuración para tráfico HTTP en desarrollo (`usesCleartextTraffic: true` y `network_security_config.xml`).

## 📱 Estructura de la Aplicación

```
app-mobile/
├── app/                    # Rutas de la aplicación (Expo Router)
│   ├── (app)/             # Rutas autenticadas
│   ├── (auth)/            # Rutas de autenticación
│   └── (courses)/         # Rutas de gestión de cursos
├── api/                    # Clientes de API y servicios
├── components/             # Componentes reutilizables
├── constants/              # Constantes y configuraciones
├── hooks/                  # Custom hooks
├── types/                  # Definiciones de tipos TypeScript
└── assets/                # Recursos estáticos
```

## 🎯 Funcionalidades por Pantalla

### Autenticación
- **Login/Register**: Autenticación con email o Google
- **Recuperación de contraseña**: Reset via email
- **Verificación PIN**: Verificación de dos factores

### Dashboard Principal
- **Home**: Vista general de cursos y tareas
- **Search**: Búsqueda avanzada de cursos
- **My Courses**: Gestión de cursos inscritos
- **My Tasks**: Lista de tareas pendientes y completadas

### Gestión de Cursos (Instructores)
- **Crear/Editar Cursos**: Formularios completos de gestión
- **Módulos**: Organización de contenido por módulos
- **Recursos**: Subida y gestión de archivos
- **Tareas**: Creación y evaluación de asignaciones
- **Estadísticas**: Métricas de progreso de estudiantes

### Comunicación
- **Chat Asistencia**: Sistema de mensajería instructor-estudiante
- **Notificaciones**: Push notifications configurables

## 🔐 Seguridad

- Autenticación JWT con Firebase
- Almacenamiento seguro con Expo Secure Store
- Validación de archivos en uploads
- Configuración de red segura para desarrollo

## 🌐 APIs y Servicios

- **Firebase**: Autenticación y notificaciones
- **Supabase**: Base de datos y almacenamiento
- **Expo**: Plataforma de desarrollo y servicios nativos

## 📄 Licencia

Este proyecto es privado y está desarrollado para fines educativos.

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, crear un issue en el repositorio.

---

**Desarrollado con ❤️ usando React Native, Expo, Firebase y Supabase**
