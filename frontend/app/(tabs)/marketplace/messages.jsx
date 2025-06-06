import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import API from "@/api/api";
import { useRouter } from "expo-router";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken.js";
import socket from "@/utils/socket";

const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetUsernames, setTargetUsernames] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const uid = await getUserIdFromToken();
        setUserId(uid);
        socket.emit("joinUserRoom", uid);
        console.log("joinedUserRoom emitted with:", uid);

        const res = await API.get("/conversations");
        setConversations(res.data);

        socket.on("conversationUpdated", (update) => {
          console.log("📬 Received conversationUpdated event:", update);
          
          setConversations((prev) => {
            const exists = prev.find((c) => c._id === update.conversationId);
            let newList;

            if (exists) {
              newList = prev.map((c) =>
                c._id === update.conversationId
                  ? { ...c, lastMessage: update.lastMessage, updatedAt: update.updatedAt }
                  : c
              );
            } else {
              newList = [
                ...prev,
                {
                  _id: update.conversationId,
                  lastMessage: update.lastMessage,
                  updatedAt: update.updatedAt,
                  participants: [],
                  otherUser: { username: "Unknown" },
                },
              ];
            }

            return newList.sort(
              (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            );
          });
        });
      } catch (err) {
        console.error("Error fetching conversations", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => {
      socket.off("conversationUpdated");
    };
  }, []);

  const getDisplayName = (conversation) => {
    if (conversation.name) return conversation.name;

    const others = conversation.participants.filter((p) => p._id !== userId);
    return others.map((u) => u.username).join(" & ");
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.convoItem}
      onPress={() => router.push(`/marketplace/${item._id}`)}
    >
      <Text style={styles.name}>{getDisplayName(item)}</Text>
      <Text numberOfLines={1} style={styles.message}>
        {item.lastMessage || "No messages yet"}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.updatedAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </Text>
    </TouchableOpacity>
  );

  const startNewChat = async () => {
    try {
      const usernames = targetUsernames
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      if (usernames.length === 0) return;

      const res = await API.post("/conversations", { usernames });
      setModalVisible(false);
      setTargetUsernames("");
      router.push(`/marketplace/${res.data._id}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      Alert.alert("Error", "One or more usernames invalid.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.newChatText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              Create New Chat
            </Text>
            <TextInput
              placeholder="Enter usernames, separated by commas"
              value={targetUsernames}
              onChangeText={setTargetUsernames}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={startNewChat} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#aaa" }]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  convoItem: {
    padding: 12,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  name: { fontWeight: "bold", fontSize: 18 },
  message: { fontSize: 14, color: "#555" },
  timestamp: { fontSize: 12, color: "#888" },
  newChatButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  newChatText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },

});

export default ConversationsPage;
