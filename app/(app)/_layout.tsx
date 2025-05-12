import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import { getItemAsync } from "expo-secure-store";
import { userApi } from "../../api/userApi";
import { Platform, View } from "react-native";

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function AppLayout() {
    const theme = useTheme();

    // Registro de token y listener de notificaciones
    useEffect(() => {
        // Configurar canal de notificaciones para Android
        if (Platform.OS === "android") {
            Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            });
        }

        // Configurar listener de notificaciones global
        const setupNotifications = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                console.log("Permiso de notificaciones denegado");
                return;
            }

            const jwt = await getItemAsync("userToken");
            const userId = await getItemAsync("userId");
            
            if (jwt && userId) {
                try {
                    // Registrar token para push notifications
                    await userApi.registerPushToken();
                    
                    // Listener para notificaciones recibidas (cuando la app está abierta)
                    const foregroundSubscription = Notifications.addNotificationReceivedListener(
                        (notification) => {
                            const { title, body } = notification.request.content;
                            Toast.show({
                                type: "info",
                                text1: title ?? "Notificación",
                                text2: body ?? "",
                                visibilityTime: 4000,
                                autoHide: true,
                            });
                        }
                    );
                    
                    // Listener para cuando se toca una notificación
                    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
                        (response) => {
                            const { data } = response.notification.request.content;
                            // Aquí puedes manejar la navegación basada en los datos de la notificación
                            console.log("Notificación tocada:", data);
                            
                            // Ejemplo de navegación basada en el tipo de notificación
                            // if (data && data.type === "course") {
                            //     router.push(`/(app)/my-courses/${data.courseId}`);
                            // } else if (data && data.type === "message") {
                            //     router.push("/(app)/messages");
                            // }
                        }
                    );
                    
                    return () => {
                        foregroundSubscription.remove();
                        responseSubscription.remove();
                    };
                } catch (error) {
                    console.error("Error al configurar notificaciones:", error);
                }
            }
        };

        setupNotifications();
    }, []);

    return (
        <>
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
                <Tabs.Screen
                    name="notification-setting"
                    options={{
                        href: null, // Esto evita que se muestre en la barra de pestañas
                    }}
                />
            </Tabs>
            <Toast />
        </>
    );
}