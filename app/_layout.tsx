import { useFonts } from 'expo-font';
import { router, Slot, SplashScreen } from 'expo-router';
import { useEffect, useState } from 'react';
import { getItemAsync } from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';
import {PaperProvider} from "react-native-paper";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {GestureHandlerRootView} from "react-native-gesture-handler";

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
      const token = await getItemAsync('userToken');
      setIsAuthenticated(!!token);
      setIsReady(true);
      SplashScreen.hideAsync();
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
          <PaperProvider>
            <Slot />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
  )
}
