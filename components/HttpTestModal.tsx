import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet, Animated, Easing, Alert, TouchableOpacity } from 'react-native';
import { Button, Text, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import axios from 'axios';

interface ConnectionStatus {
  server8080: 'testing' | 'success' | 'failed' | 'pending';
  server3000: 'testing' | 'success' | 'failed' | 'pending';
  lastTested: Date | null;
  server8080Headers?: any;
  server3000Headers?: any;
  server8080Status?: number;
  server3000Status?: number;
}

const HttpTestModal = () => {
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    server8080: 'pending',
    server3000: 'pending',
    lastTested: null,
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Animación de entrada
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const testHttp = async () => {
    setTesting(true);
    setConnectionStatus({
      server8080: 'testing',
      server3000: 'testing',
      lastTested: null,
    });
    
    const tests = [
      { url: 'http://35.223.247.76:8080/users', key: 'server8080' as keyof Pick<ConnectionStatus, 'server8080' | 'server3000'> },
      { url: 'http://35.223.247.76:3000/courses', key: 'server3000' as keyof Pick<ConnectionStatus, 'server8080' | 'server3000'> }
    ];

    for (const test of tests) {
      try {
        const response = await axios.get(test.url, { timeout: 5000 });
        setConnectionStatus(prev => ({
          ...prev,
          [test.key]: 'success',
          lastTested: new Date(),
          [`${test.key}Headers`]: response.headers,
          [`${test.key}Status`]: response.status,
        }));
      } catch (error: any) {
        if (error.response?.status) {
          // Si hay respuesta HTTP (aunque sea error), la conexión funciona
          setConnectionStatus(prev => ({
            ...prev,
            [test.key]: 'success',
            lastTested: new Date(),
            [`${test.key}Headers`]: error.response.headers,
            [`${test.key}Status`]: error.response.status,
          }));
        } else {
          setConnectionStatus(prev => ({
            ...prev,
            [test.key]: 'failed',
            lastTested: new Date(),
          }));
        }
      }
    }
    
    setTesting(false);
  };

  const getStatusDisplay = (status: ConnectionStatus['server8080']) => {
    switch (status) {
      case 'testing':
        return { color: '#FFA500', text: 'Probando...', icon: 'loading' };
      case 'success':
        return { color: '#4CAF50', text: 'Conectado', icon: 'check-circle' };
      case 'failed':
        return { color: '#F44336', text: 'Error', icon: 'alert-circle' };
      default:
        return { color: '#9E9E9E', text: 'Pendiente', icon: 'help-circle' };
    }
  };

  const showConnectionDetails = (serverKey: 'server8080' | 'server3000') => {
    const headers = connectionStatus[`${serverKey}Headers` as keyof ConnectionStatus];
    const status = connectionStatus[`${serverKey}Status` as keyof ConnectionStatus];
    const serverName = serverKey === 'server8080' ? 'Backend (8080)' : 'Cursos (3000)';
    
    if (!headers || !status) {
      Alert.alert('Sin Datos', 'No hay información de headers disponible');
      return;
    }

    const headersList = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    Alert.alert(
      `📡 Detalles HTTP - ${serverName}`,
      `Status Code: ${status}\n\n` +
      `Headers:\n${headersList}`,
      [
        { text: 'Copiar Headers', onPress: () => {
          // En una app real, aquí usarías Clipboard
          console.log('Headers:', headers);
        }},
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      // Reset state when closing
      setConnectionStatus({
        server8080: 'pending',
        server3000: 'pending',
        lastTested: null,
      });
    });
  };

  const openModal = () => {
    setVisible(true);
    // Small delay to allow modal to render before starting test
    setTimeout(() => testHttp(), 100);
  };

  return (
    <>
      <Button 
        mode="outlined" 
        onPress={openModal}
        style={styles.button}
        disabled={testing}
        icon="wifi"
      >
        🔗 Test HTTP
      </Button>
      
      <Modal visible={visible} transparent animationType="none">
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <View style={styles.header}>
              <Text style={styles.title}>🔗 Conectividad HTTP</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={handleClose}
                style={styles.closeButton}
              />
            </View>
            
            <View style={styles.content}>
              <Text style={styles.description}>
                Estado de conexión a servidores:
              </Text>
              
              <View style={styles.statusContainer}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusIndicator, { 
                    backgroundColor: getStatusDisplay(connectionStatus.server8080).color 
                  }]} />
                  <Text style={styles.serverLabel}>Backend (8080):</Text>
                  <TouchableOpacity
                    onPress={() => connectionStatus.server8080 === 'success' && showConnectionDetails('server8080')}
                    disabled={connectionStatus.server8080 !== 'success'}
                  >
                    <Chip
                      mode="outlined"
                      style={[
                        styles.statusChip, 
                        { borderColor: getStatusDisplay(connectionStatus.server8080).color },
                        connectionStatus.server8080 === 'success' && styles.clickableChip
                      ]}
                      textStyle={{ color: getStatusDisplay(connectionStatus.server8080).color }}
                      icon={getStatusDisplay(connectionStatus.server8080).icon}
                    >
                      {getStatusDisplay(connectionStatus.server8080).text}
                      {connectionStatus.server8080 === 'success' && ' 📋'}
                    </Chip>
                  </TouchableOpacity>
                </View>

                <View style={styles.statusRow}>
                  <View style={[styles.statusIndicator, { 
                    backgroundColor: getStatusDisplay(connectionStatus.server3000).color 
                  }]} />
                  <Text style={styles.serverLabel}>Cursos (3000):</Text>
                  <TouchableOpacity
                    onPress={() => connectionStatus.server3000 === 'success' && showConnectionDetails('server3000')}
                    disabled={connectionStatus.server3000 !== 'success'}
                  >
                    <Chip
                      mode="outlined"
                      style={[
                        styles.statusChip, 
                        { borderColor: getStatusDisplay(connectionStatus.server3000).color },
                        connectionStatus.server3000 === 'success' && styles.clickableChip
                      ]}
                      textStyle={{ color: getStatusDisplay(connectionStatus.server3000).color }}
                      icon={getStatusDisplay(connectionStatus.server3000).icon}
                    >
                      {getStatusDisplay(connectionStatus.server3000).text}
                      {connectionStatus.server3000 === 'success' && ' 📋'}
                    </Chip>
                  </TouchableOpacity>
                </View>
              </View>

              {testing && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.loadingText}>Probando conexiones...</Text>
                </View>
              )}

              {connectionStatus.lastTested && (
                <Text style={styles.resultMessage}>
                  {(connectionStatus.server8080 === 'success' || connectionStatus.server3000 === 'success') 
                    ? '✅ El fix de cleartext HTTP está funcionando correctamente!'
                    : '❌ Problemas de conectividad detectados. Verifica tu red.'
                  }
                </Text>
              )}

              {(connectionStatus.server8080 === 'success' || connectionStatus.server3000 === 'success') && (
                <Text style={styles.hintText}>
                  💡 Toca los chips "Conectado 📋" para ver detalles HTTP
                </Text>
              )}

              {connectionStatus.lastTested && (
                <Text style={styles.timeText}>
                  Última prueba: {connectionStatus.lastTested.toLocaleTimeString()}
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <Button 
                mode="outlined"
                onPress={() => testHttp()}
                style={styles.actionButton}
                disabled={testing}
                icon="refresh"
              >
                Probar de nuevo
              </Button>
              <Button 
                mode="contained"
                onPress={handleClose}
                style={styles.actionButton}
              >
                Continuar
              </Button>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: { 
    marginTop: 20, 
    backgroundColor: '#f0f8ff' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    padding: 20 
  },
  container: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  content: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  serverLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  statusChip: {
    marginLeft: 10,
  },
  clickableChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  timeText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default HttpTestModal; 