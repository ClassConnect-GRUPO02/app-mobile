import { useFonts } from 'expo-font';
import { router, Slot, SplashScreen } from 'expo-router';
import { useEffect, useState } from 'react';
import { getItemAsync } from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';
import {PaperProvider, MD3LightTheme} from "react-native-paper";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import { AppColors } from '@/constants/Colors';

// Tema personalizado con paleta violeta
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: AppColors.primary,
    primaryContainer: AppColors.primarySoft,
    secondary: AppColors.primaryLight,
    secondaryContainer: AppColors.primarySoft,
    tertiary: AppColors.primaryDark,
    surface: AppColors.surface,
    surfaceVariant: AppColors.backgroundSecondary,
    background: AppColors.background,
    onPrimary: AppColors.textOnPrimary,
    onSecondary: AppColors.textOnPrimary,
    onSurface: AppColors.text,
    onBackground: AppColors.text,
    outline: AppColors.border,
    outlineVariant: AppColors.divider,
  },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Manejar lógica de auth
useEffect(() => {
  const prepare = async () => {
    try {
      // ✅ Verificamos si hay email pendiente de verificación
      const pendingEmail = await getItemAsync("pendingEmailVerification");
      
      if (pendingEmail) {
        console.log("Email pendiente de verificación encontrado:", pendingEmail);
        setIsAuthenticated(false); // No está autenticado hasta verificar
        setIsReady(true);
        SplashScreen.hideAsync();
        // Navegamos a verify-pin con el email
        router.replace(`/(auth)/verify-pin?email=${encodeURIComponent(pendingEmail)}`);
        return; // Salimos del flujo
      }

      // ✅ Si no hay email pendiente, seguimos con auth normal
      const token = await getItemAsync('userToken');
      setIsAuthenticated(!!token);
      setIsReady(true);
      SplashScreen.hideAsync();
    } catch (error) {
      console.error("Error en prepare:", error);
      setIsAuthenticated(false);
      setIsReady(true);
      SplashScreen.hideAsync();
    }
  };

  if (loaded) {
    prepare();
  }
}, [loaded]);

  // Redirigir una vez que tenemos info de auth
  useEffect(() => {
    if (isReady) {
      if (isAuthenticated === false) {
        router.replace('/(auth)/login');
      } else if (isAuthenticated === true) {
        router.replace('/(app)/home');
      }
    }
  }, [isAuthenticated, isReady]);

  // Mostrar loader mientras preparamos
  if (!loaded || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Debe devolver algo siempre: Slot maneja el resto de las rutas
  return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={customTheme}>
            <Slot />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
  )
}
