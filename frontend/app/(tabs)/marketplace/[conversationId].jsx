import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import API from "@/api/api";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import socket from "@/utils/socket";

const ConversationDetailPage = () => {
  const { conversationId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    let active = true;
    let uid = null;

    const handleReceiveMessage = (message) => {
      console.log("Received message:", message);
      if (!active) return;

      setMessages((prev) => [...prev, message]);
      scrollToBottom();

      // Acknowledge delivery
      if (uid) {
        socket.emit("messageDelivered", {
          messageId: message._id,
          userId: uid,
        });
      }
    };

    const init = async () => {
      uid = await getUserIdFromToken();
      setUserId(uid);

      socket.emit("joinConversation", conversationId);
      console.log("Joined conversation room:", conversationId);

      const res = await API.get(`/conversations/${conversationId}/messages`);
      setMessages(res.data);
      scrollToBottom();

      // ⚠️ Move the listener here to ensure it's registered AFTER userId
      socket.on("receiveMessage", handleReceiveMessage);
    };

    init();

    return () => {
      active = false;
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [conversationId]);





  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const res = await API.post(`/conversations/${conversationId}/messages`, {
        text: input,
      });

      const message = res.data;

      setMessages((prev) => [...prev, message]);
      scrollToBottom();
      setInput("");

      // Extract participant IDs from existing messages
      const participantIds = [
        message.sender._id,
        ...new Set(
          messages
            .map((m) => m.sender._id)
            .filter((id) => id !== message.sender._id)
        ),
      ];

      socket.emit("sendMessage", {
        conversationId,
        message: {
          ...message,
          participants: participantIds,
        },
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };



  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender._id === userId ? styles.outgoing : styles.incoming,
      ]}
    >
      <Text>{item.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={styles.textInput}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  messageList: { padding: 10 },
  messageBubble: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    maxWidth: "80%",
  },
  incoming: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  outgoing: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
  },
  timestamp: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopColor: "#ccc",
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  sendButton: {
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  sendText: {
    color: "blue",
    fontWeight: "bold",
  },
});

export default ConversationDetailPage;
