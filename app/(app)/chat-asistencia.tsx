import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { getItemAsync } from "expo-secure-store";
import { userApi } from "@/api/userApi";
import { ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { chatClient } from "@/api/chatClient";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  isUser: boolean;
  userName?: string;
}

export default function ChatAsistenciaScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedUserId = await getItemAsync("userId");
      console.log("Stored userId:", storedUserId); // Asegúrate que sea '6' (string)

      if (storedUserId) {
        setUserId(storedUserId);

        try {
          const user = await userApi.getUserById(storedUserId);
          if (user?.user?.name) {
            setUserName(user.user.name);
          }
        } catch (error) {
          console.warn("Error obteniendo nombre del usuario", error);
        }

        try {
          const q = query(
            collection(db, "chat"),
            where("userId", "==", storedUserId),
            orderBy("timestamp", "asc")
          );

          const snapshot = await getDocs(q);
          console.log("Chat history snapshot:", snapshot);
          if (snapshot.empty) {
            console.log("No chat history found for user:", storedUserId);
            setLoading(false);
            return;
          }
          const loadedMessages: ChatMessage[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            loadedMessages.push({
              id: doc.id,
              text: data.pregunta,
              createdAt: data.timestamp?.toDate?.() ?? new Date(),
              isUser: true,
            });
            loadedMessages.push({
              id: `${doc.id}-res`,
              text: data.respuesta,
              createdAt: data.timestamp?.toDate?.() ?? new Date(),
              isUser: false,
            });
          });

          // Mensaje inicial + historial
          setMessages([
            ...loadedMessages,
            {
              id: "initial",
              text: "¡Hola! Soy tu asistente de ClassConnect. ¿En qué puedo ayudarte hoy?",
              createdAt: new Date(),
              isUser: false,
            },
          ]);
        } catch (error) {
          console.warn("Error cargando historial del chat:", error);
        }
      }

      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  // Función para construir historial para OpenAI
  const buildHistory = (msgs: ChatMessage[]) => {
    return msgs
      .slice()
      .reverse()
      .map((msg) => ({
        role: msg.isUser ? ("user" as const) : ("assistant" as const),
        content: msg.text,
      }));
  };

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      createdAt: new Date(),
      isUser: true,
      userName: userName,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setSending(true);

    if (!userId) {
      console.warn("No se encontró userId en SecureStore");
      setSending(false);
      return;
    }

    try {
      const history = buildHistory([...messages, userMessage].slice(-5));

      // Descomenta esta línea cuando tengas el API funcionando
      const response = await chatClient.sendChatMessage({
        message: userMessage.text,
        history,
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + Math.random()).toString(),
        text: response.data,
        createdAt: new Date(),
        isUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Guardar en Firebase
      await addDoc(collection(db, "chat"), {
        userId,
        pregunta: userMessage.text,
        respuesta: response.data,
        timestamp: serverTimestamp(),
      });

      // Scroll al final después de añadir mensaje
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error(
        "Error procesando el mensaje o guardando en Firebase:",
        error
      );
    } finally {
      setSending(false);
    }
  }, [inputText, messages, userId, userName, sending]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    return (
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userText : styles.botText,
            ]}
          >
            {item.text}
          </Text>
          <Text style={styles.timeText}>
            {item.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe tu duda..."
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // fondo blanco limpio
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messagesContainer: {
    paddingBottom: 20, // espacio para que no se corte el último mensaje al hacer scroll
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#6200ee", // Morado de tu app
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#f5f5f5", // Gris muy claro para el bot
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#333",
  },
  timeText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: "#6200ee",
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6200ee",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
});
