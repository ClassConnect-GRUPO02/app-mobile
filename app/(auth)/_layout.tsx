import { Stack } from "expo-router"
import React from "react"

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-pin" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="resetpassword" />
    </Stack>
  )
}

