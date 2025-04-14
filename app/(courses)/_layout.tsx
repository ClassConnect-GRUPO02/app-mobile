import { Stack } from "expo-router"
import React from "react"
import {MD3LightTheme, PaperProvider} from "react-native-paper";

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: "#6200ee",
        secondary: "#03dac6",
    },
}

export default function CoursesLayout() {
    return (
        <PaperProvider theme={theme}>
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#6200ee",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                },
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Explorar Cursos",
                }}
            />
            <Stack.Screen
                name="create"
                options={{
                    title: "Crear Curso",
                    presentation: "modal",
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: "Detalle del Curso",
                }}
            />
        </Stack>
            </PaperProvider>
    )
}
