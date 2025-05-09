## Problema: Google Sign-In no funciona directamente en Expo Go

Cuando intentas implementar la autenticación con Google Sign-In en una aplicación Expo, te encuentras con varios problemas según la plataforma y el método de ejecución.

### Limitaciones de Expo Go

**Expo Go** es el cliente de desarrollo predeterminado que permite ejecutar rápidamente aplicaciones Expo sin necesidad de compilación nativa. Sin embargo, tiene limitaciones importantes:

- No admite módulos nativos personalizados que requieran vinculación nativa (native linking)
- El mensaje de error `TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found` aparece porque el módulo nativo de Google Sign-In no está disponible en Expo Go

```
(NOBRIDGE) ERROR  Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found. Verify that a module by this name is registered in the native binary.
```

### Diferencias entre plataformas

1. **En Android**:
   - Depende de Google Play Services
   - Utiliza el Credential Manager de Android
   - Requiere configuración en `google-services.json`

2. **En iOS**:
   - Utiliza el SDK de Google Sign-In para iOS
   - Requiere el archivo `GoogleService-Info.plist`
   - No usa Google Play Services (son exclusivos de Android)

## Solución: Development Builds con Expo

Para utilizar Google Sign-In en una aplicación Expo, debes crear un "development build" que incluya los módulos nativos necesarios:

### 1. Instalación de dependencias

```bash
npx expo install @react-native-google-signin/google-signin expo-dev-client
```

### 2. Configuración de app.json

Es necesario configurar correctamente el archivo `app.json` para incluir los archivos de configuración de Google y el plugin de Google Sign-In:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tuapp.nombre",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.tuapp.nombre",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

### 3. Preparación de archivos de configuración

#### Para Android y iOS: google-services.json y GoogleService-Info.plist

Descárgalo desde Firebase Console o Google Cloud Console.

### 4. Generación del build nativo (prebuild)

Este paso es **crítico** y es donde muchos desarrolladores encuentran problemas:

```bash
npx expo prebuild --clean
```

Este comando genera el código nativo para iOS y Android que incluye los módulos nativos necesarios. Sin ejecutar este paso, los módulos nativos como Google Sign-In no funcionarán.

### 5. Ejecución del development build

Después del prebuild, puedes ejecutar la aplicación con:

```bash
npx expo run:android  # Para Android
npx expo run:ios      # Para iOS
```

## Por qué funciona con ADB en Android

Cuando ejecutas la aplicación directamente en un dispositivo Android usando ADB (Android Debug Bridge):

1. **Acceso nativo**: El código se ejecuta directamente en el entorno nativo del dispositivo, no dentro de Expo Go.

2. **Google Play Services**: La mayoría de dispositivos Android (excepto algunos dispositivos chinos) tienen Google Play Services instalados, que son necesarios para Google Sign-In.

3. **Vinculación nativa**: Al ejecutar con `expo run:android` o al instalar un APK compilado, todos los módulos nativos están correctamente vinculados.

## Flujo de desarrollo recomendado

1. **Desarrollo inicial**: Usa Expo Go para desarrollo rápido de la UI y lógica básica

2. **Integración de autenticación**: 
   - Ejecuta `npx expo prebuild` para generar código nativo
   - Configura los archivos de Google (plist y json)
   - Usa `npx expo run:android` o `npx expo run:ios` para probar

3. **Depuración**:
   - Problemas de configuración: Verifica IDs de cliente y configuración en app.json
   - Errores de módulo no encontrado: Asegúrate de estar usando un development build, no Expo Go

## Alternativas

1. **Firebase Auth Web**: Usa la versión web de Firebase Auth, que funciona con Expo Go sin problemas
2. **Expo AuthSession**: Para flujos de autenticación web (OAuth) que funcionan en Expo Go
3. **Expo EAS Build**: Crea builds de desarrollo en la nube sin configuración local

Google Sign-In en Expo requiere un enfoque diferente al desarrollo estándar con Expo Go. La clave está en entender que los módulos nativos como Google Sign-In necesitan un development build para funcionar correctamente.
