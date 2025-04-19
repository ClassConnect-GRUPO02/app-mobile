import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';

// Esta pantalla solo sirve como redirección al index
export default function HomeRedirect() {
  useEffect(() => {
    // Redirigir a la página index que es nuestra verdadera pantalla de inicio
    router.replace('/(app)');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
