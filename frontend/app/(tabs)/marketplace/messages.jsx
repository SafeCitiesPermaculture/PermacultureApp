import { useEffect, useState, useCallback } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import API from "@/api/api";
import { useRouter } from "expo-router";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken.js";
import socket from "@/utils/socket";
import { useFocusEffect } from "@react-navigation/native";

const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetUsernames, setTargetUsernames] = useState("");
  const router = useRouter();
  const newChatButtonIcon = require("@/assets/images/post-button.png");

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const uid = await getUserIdFromToken();
          setUserId(uid);
          socket.emit("joinUserRoom", uid);

          const res = await API.get("/conversations");
          setConversations(res.data);
        } catch (err) {
          console.error("Error fetching conversations", err);
        } finally {
          setLoading(false);
        }
      };

      init();

      // Real-time conversation updates
      socket.on("conversationUpdated", (updated) => {
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === updated.conversationId);
          let updatedList;

          if (exists) {
            updatedList = prev.map((c) =>
              c._id === updated.conversationId
                ? {
                    ...c,
                    name: updated.name ?? c.name,
                    lastMessage: updated.lastMessage,
                    updatedAt: updated.updatedAt,
                  }
                : c
            );
          } else {
            updatedList = [updated, ...prev];
          }

          return updatedList.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        });
      });

      return () => {
        socket.off("conversationUpdated");
      };
    }, [])
  );

  const getDisplayName = (conversation) => {
    if (!conversation || !conversation.participants) return "Unnamed";

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

      // make sure you're using res.data._id
      const newConvoId = res.data?._id || res._id;
      if (!newConvoId) {
        console.error("New conversation ID is missing:", res);
        if (Platform.OS === "web") {
          alert("Error: Failed to create conversation");
        } else {
          Alert.alert("Error", "Failed to create conversation.");
        }
        return;
      }

      router.push(`/marketplace/${newConvoId}`);

    } catch (err) {
      console.error("Error starting chat:", err);
      if (Platform.OS === 'web') {
        alert("Error: One or more usernames invalid.")
      } else {
        Alert.alert("Error", "One or more usernames invalid.");
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
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
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.newChatButton}
      >
        <Image source={newChatButtonIcon} style={{ height: 50, width: 50 }} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 0, paddingBottom: 120 },
  convoItem: { padding: 12, borderBottomColor: "#ccc", borderBottomWidth: 1 },
  name: { fontWeight: "bold", fontSize: 18 },
  message: { fontSize: 14, color: "#555" },
  timestamp: { fontSize: 12, color: "#888" },
  newChatButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "transparent",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
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
  modalButtonText: { color: "white", fontWeight: "bold" },
});

export default ConversationsPage;
