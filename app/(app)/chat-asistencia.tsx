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
  Alert,
} from "react-native";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
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
  useful?: boolean | null; // Para feedback de utilidad
  escalated?: boolean; // Para saber si se ha escalado a soporte
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
              escalated: data.escalated ?? false, // Añadir campo escalated si existe
            });
            loadedMessages.push({
              id: `${doc.id}-res`,
              text: data.respuesta,
              createdAt: data.timestamp?.toDate?.() ?? new Date(),
              isUser: false,
              useful: data.useful ?? null,
              escalated: data.escalated ?? false, // Añadir campo escalated si existe
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
        useful: msg.useful ?? null, // Añadir campo de utilidad si existe
      }));
  };

  const handleFeedback = async (messageId: string, wasUseful: boolean) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId ? { ...msg, useful: wasUseful } : msg
    );
    setMessages(updatedMessages);

    const messageID = messageId.replace("-res", ""); // Asegurarse de que el ID sea correcto
    console.log(
      "Actualizando feedback para el mensaje ID:",
      messageID,
      "con valor:",
      wasUseful
    );
    try {
      const docRef = doc(db, "chat", messageID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          useful: wasUseful,
        });
      } else {
        console.warn("No se encontró el mensaje en Firebase para actualizar");
      }
    } catch (error) {
      console.error("Error actualizando feedback en Firebase:", error);
    }
  };

const escalateToHuman = async (botMessage: ChatMessage) => {
  const messageID = botMessage.id.replace("-res", "");

  try {
    const user = await userApi.getUserById(userId ?? "");
    const userEmail = user?.user?.email || null;

    // Actualizar el mensaje original con escalated = true
    const docRef = doc(db, "chat", messageID);
    await updateDoc(docRef, {
      escalated: true,
    });

    // Buscar el mensaje del usuario anterior
    const userMessage = messages.find((msg) => msg.id === messageID);

    if (userMessage) {
      // Guardar en colección aparte
      await addDoc(collection(db, "escalados"), {
        userId,
        email: userEmail ?? "no-email",
        consulta: userMessage.text,
        respuestaBot: botMessage.text,
        timestamp: new Date(),
      });

      Alert.alert(
        "Consulta derivada",
        "Soporte se contactará para responder su consulta."
      );
    }
  } catch (error) {
    console.error("Error escalando mensaje a soporte:", error);
    Alert.alert(
      "Error",
      "Ocurrió un error al derivar la consulta. Inténtelo más tarde."
    );
  }
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

      const response = await chatClient.sendChatMessage({
        message: userMessage.text,
        history,
      });

      // Guardar en Firebase y obtener docRef
      const docRef = await addDoc(collection(db, "chat"), {
        userId,
        pregunta: userMessage.text,
        respuesta: response.data,
        timestamp: serverTimestamp(),
      });

      // Usamos el ID real de Firebase (para que funcione el feedback)
      const botMessage: ChatMessage = {
        id: `${docRef.id}-res`, // <- esto es lo importante
        text: response.data,
        createdAt: new Date(),
        isUser: false,
        useful: null,
      };

      setMessages((prev) => [...prev, botMessage]);

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

      {!item.isUser && item.id !== "initial" && (
        <>
          {item.text.startsWith("Lo siento, no tengo") && !item.escalated ? (
            <TouchableOpacity
              onPress={() => escalateToHuman(item)}
              style={{ marginTop: 6, marginLeft: 8 }}
            >
              <Text style={{ color: "#e53935", fontWeight: "bold" }}>
                Derivar a soporte
              </Text>
            </TouchableOpacity>
          ) : item.escalated ? (
            <Text style={{ color: "#999", marginLeft: 8, fontStyle: "italic" }}>
              Consulta derivada a soporte.
            </Text>
          ) : (
            <View style={{ flexDirection: "row", marginTop: 4, marginLeft: 8 }}>
              <TouchableOpacity
                onPress={() => handleFeedback(item.id, true)}
                style={{ marginRight: 8 }}
              >
                <Ionicons
                  name="thumbs-up"
                  size={20}
                  color={item.useful === true ? "#6200ee" : "#999"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFeedback(item.id, false)}>
                <Ionicons
                  name="thumbs-down"
                  size={20}
                  color={item.useful === false ? "#e53935" : "#999"}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
