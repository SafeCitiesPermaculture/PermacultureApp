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
    Modal
} from "react-native";
import API from "@/api/api";
import { useRouter } from "expo-router";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken.js";
import socket from "@/utils/socket"; // NEW IMPORT

const ConversationsPage = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [targetUsername, setTargetUsername] = useState("");
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            try {
                const uid = await getUserIdFromToken();
                setUserId(uid);
                socket.emit("joinUserRoom", uid); // Join user-specific socket room

                const res = await API.get("/conversations");
                console.log("Fetched conversations:", res.data);

                setConversations(res.data);
            } catch (err) {
                console.error("Error fetching conversations", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Listen for real-time conversation updates
    useEffect(() => {
        socket.on("conversationUpdated", (update) => {
            console.log("Received conversationUpdated event:", update);

            setConversations((prev) => {
            const updated = prev.map((c) =>
                c._id === update.conversationId
                ? { ...c, lastMessage: update.lastMessage, updatedAt: update.updatedAt }
                : c
            );
            return updated.sort(
                (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            });
        });

        return () => {
            socket.off("conversationUpdated");
        };
        }, []);


    const getOtherUser = (participants) => {
        return participants.find((p) => p._id !== userId);
    };

    const renderItem = ({ item }) => {
        const otherUser = getOtherUser(item.participants);

        return (
            <TouchableOpacity
                style={styles.convoItem}
                onPress={() => router.push(`/marketplace/${item._id}`)}
            >
                <Text style={styles.name}>
                    {otherUser?.username || "Unknown User"}
                </Text>
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
                        })
                    }
                </Text>
            </TouchableOpacity>
        );
    };

    if (conversations.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No conversations yet. Start a new chat!</Text>
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

            {/* FLOATING BUTTON */}
            <TouchableOpacity
                style={styles.newChatButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.newChatText}>+</Text>
            </TouchableOpacity>

            {/* MODAL INPUT */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={{ fontSize: 18, marginBottom: 10 }}>Start New Chat</Text>
                        <TextInput
                            placeholder="Enter username"
                            value={targetUsername}
                            onChangeText={setTargetUsername}
                            style={styles.input}
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        if (!targetUsername.trim()) return;
                                        const res = await API.post("/conversations", {
                                            username: targetUsername.trim(),
                                        });
                                        setModalVisible(false);
                                        setTargetUsername("");
                                        router.push(`/marketplace/${res.data._id}`);
                                    } catch (err) {
                                        console.error("Error starting chat:", err);
                                        Alert.alert("Error", "User not found or cannot start chat.");
                                    }
                                }}
                                style={styles.modalButton}
                            >
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
        bottom: 30,
        right: 30,
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
