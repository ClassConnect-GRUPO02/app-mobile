import { useFonts } from 'expo-font';
import { router, Slot, SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { getItemAsync } from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';
import {PaperProvider} from "react-native-paper";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../components/ThemeProvider';

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
    // ✅ Verificamos si hay email pendiente
    const pendingEmail = await AsyncStorage.getItem("pendingEmailVerification");
    if (pendingEmail) {
      SplashScreen.hideAsync();
      router.replace(`/(auth)/verify-pin?email=${pendingEmail}`);
      return; // Salimos del flujo
    }

    // ✅ Si no hay email pendiente, seguimos con auth normal
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
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#2B2B3C',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(app)"
          options={{
            headerShown: true,
          }}
        />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <PaperProvider>
              <Slot />
            </PaperProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Stack>
    </ThemeProvider>
  )
}
