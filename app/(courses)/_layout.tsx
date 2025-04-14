import { Stack } from "expo-router"
import React from "react"
import { PaperProvider, MD3LightTheme, Portal } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: "#6200ee",
        secondary: "#03dac6",
    },
}

export default function Layout() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <Portal.Host>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: "#fff" },
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen
                            name="course/[id]"
                            options={{
                                presentation: "card",
                                animation: "slide_from_right",
                            }}
                        />
                        <Stack.Screen
                            name="(courses)"
                            options={{
                                headerShown: false,
                            }}
                        />
                    </Stack>
                </Portal.Host>
            </PaperProvider>
        </SafeAreaProvider>
    )
}
