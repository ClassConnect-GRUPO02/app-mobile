// screens/ChatAsistenciaScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { View, StyleSheet } from 'react-native';

export default function ChatAsistenciaScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const user: User = {
    _id: 1,
    name: 'Usuario',
  };

  useEffect(() => {
    // Mensaje de bienvenida del bot
    setMessages([
      {
        _id: 1,
        text: '¡Hola! Soy tu asistente de la plataforma. ¿En qué puedo ayudarte hoy?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Asistente IA',
        },
      },
    ]);
  }, []);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

    const userMessage = newMessages[0].text;

    // Llamada a tu backend que conecta con OpenAI
    try {
      const response = await fetch('https://TU_BACKEND/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      const botMessage: IMessage = {
        _id: Math.random(),
        text: data.reply || 'Lo siento, no entendí tu consulta.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Asistente IA',
        },
      };

      setMessages(previousMessages => GiftedChat.append(previousMessages, [botMessage]));
    } catch (error) {
      console.error('Error al obtener respuesta del bot:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={user}
        placeholder="Escribe tu duda..."
        showUserAvatar
        alwaysShowSend
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
