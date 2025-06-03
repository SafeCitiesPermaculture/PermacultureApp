import { useLocalSearchParams, useNavigation  } from "expo-router";
import { useEffect, useState, useRef, useLayoutEffect  } from "react";
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
  const navigation = useNavigation();
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    let active = true;
    let uid = null;

    console.log("🔌 Socket connected?", socket.connected, "ID:", socket.id);
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

      const convoRes = await API.get(`/conversations/${conversationId}`);
      const participants = convoRes.data.participants;
      const other = participants.find((p) => p._id !== uid);
      if (other) setOtherUser(other);


      socket.on("receiveMessage", handleReceiveMessage);
    };

    init();

    return () => {
      active = false;
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [conversationId]);

  useLayoutEffect(() => {
    if (otherUser?.username) {
      navigation.setOptions({ title: otherUser.username });
    }
  }, [otherUser]);




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

      // extract participant IDs from current messages
      const participantIds = new Set([
        message.sender._id,
        ...messages.map((m) => m.sender._id),
      ]);

      const emitPayload = {
        conversationId,
        message: {
          ...message,
          participants: [...participantIds],
        },
      };

      console.log("📡 Emitting sendMessage socket event with:", emitPayload);

      // 🔥 EMIT SOCKET EVENT
      socket.emit("sendMessage", emitPayload);

      setMessages((prev) => [...prev, message]);
      scrollToBottom();
      setInput("");
    } catch (err) {
      console.error("❌ Failed to send message", err);
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
        {new Date(item.updatedAt).toLocaleString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
