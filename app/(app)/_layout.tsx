import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from 'expo-notifications';

import { registerPushToken } from '@/lib/pushNotifications';
import Toast from 'react-native-toast-message';
import { getItemAsync } from "expo-secure-store";

export default function AppLayout() {
    const theme = useTheme()

      // Registro de token y listener de notificaciones
useEffect(() => {
    const fetchData = async () => {
        const jwt = await getItemAsync('userToken');
        if (jwt) {
            registerPushToken(jwt);
    
            const subscription = Notifications.addNotificationReceivedListener(notification => {
                const { title, body } = notification.request.content;
    
                Toast.show({
                    type: 'info',
                    text1: title ?? 'Notificación',
                    text2: body ?? '',
                    visibilityTime: 4000,
                    autoHide: true,
                });
            });
    
            return () => subscription.remove();
        }
    };

    fetchData();
}, []);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: "gray",
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopColor: "#EEEEEE",
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index" // Referencia a app/(app)/index.tsx
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="search" // Referencia a app/(app)/search.tsx
                options={{
                    title: "Buscar",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "search" : "search-outline"} size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="my-courses"
                options={{
                    title: "Mis cursos",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "laptop" : "laptop-outline"} size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="me" // esta es la pantalla me.tsx, que redirige al perfil propio
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
                    ),
                }}
            />

            {/* Ocultar las otras rutas de la barra de pestañas */}
            <Tabs.Screen
                name="home"
                options={{
                    href: null, // Esto evita que se muestre en la barra de pestañas
                }}
            />


            <Tabs.Screen
                name="profile/[id]"
                options={{
                    href: null, // Esto evita que se muestre en la barra de pestañas
                }}
            />
        </Tabs>
    )
}