import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState, useRef, useLayoutEffect, useContext } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "@/api/api";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import socket from "@/utils/socket";
import { AuthContext } from "@/context/AuthContext";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ConversationDetailPage = () => {
    const { conversationId } = useLocalSearchParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState(null);
    const flatListRef = useRef(null);
    const navigation = useNavigation();
    const [otherUser, setOtherUser] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const { userData } = useContext(AuthContext);

    useEffect(() => {
        if (!conversationId || conversationId === "undefined") return;
        let active = true;
        let uid = null;

        const requestNotificationPermission = async () => {
            if (Platform.OS !== "web") {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== "granted") {
                Alert.alert(
                "Permission required",
                "Please enable notifications in your device settings to receive alerts."
                );
            }
            }
        };

        const handleReceiveMessage = async (message) => {
            if (!active) return;

            setMessages((prev) => [message, ...prev]);

            if (uid && !message.deliveredTo.includes(uid)) {
                socket.emit("messageDelivered", {
                messageId: message._id,
                userId: uid,
                });
            }

            if (uid && !message.seenBy.includes(uid)) {
                socket.emit("messageSeen", {
                messageId: message._id,
                userId: uid,
                });
            }

            // ✅ Avoid crash on web
            if (Platform.OS !== "web" && message.sender._id !== uid) {
                await Notifications.scheduleNotificationAsync({
                content: {
                    title: `New message from ${message.sender.username || "Someone"}`,
                    body: message.text,
                    data: {
                    conversationId: message.conversation,
                    },
                    sound: "default",
                },
                trigger: null,
                });
            }
        };


        const handleMessageDelivered = ({ messageId, userId }) => {
            setMessages((prev) =>
            prev.map((msg) =>
                msg._id === messageId && !msg.deliveredTo.includes(userId)
                ? { ...msg, deliveredTo: [...msg.deliveredTo, userId] }
                : msg
            )
            );
        };

        const handleMessageSeen = ({ messageId, userId }) => {
            setMessages((prev) =>
            prev.map((msg) =>
                msg._id === messageId && !msg.seenBy.includes(userId)
                ? { ...msg, seenBy: [...msg.seenBy, userId] }
                : msg
            )
            );
        };

        const init = async () => {
            try {
            await requestNotificationPermission();

            uid = await getUserIdFromToken();
            setUserId(uid);

            socket.emit("joinConversation", conversationId);

            const res = await API.get(`/conversations/${conversationId}/messages`);
            const fetchedMessages = res.data.reverse();
            setMessages(fetchedMessages);

            const convoRes = await API.get(`/conversations/${conversationId}`);
            setConversation(convoRes.data);

            const participants = convoRes.data.participants;
            const other = participants.find((p) => p._id !== uid);
            if (other) setOtherUser(other);

            // Mark messages delivered/seen
            fetchedMessages.forEach((msg) => {
                if (!msg.deliveredTo.includes(uid)) {
                socket.emit("messageDelivered", {
                    messageId: msg._id,
                    userId: uid,
                });
                }
                if (!msg.seenBy.includes(uid)) {
                socket.emit("messageSeen", {
                    messageId: msg._id,
                    userId: uid,
                });
                }
            });
            } catch (err) {
            console.error("Error loading conversation:", err);
            } finally {
            setLoading(false);
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("messageDelivered", handleMessageDelivered);
        socket.on("messageSeen", handleMessageSeen);

        init();

        return () => {
            active = false;
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("messageDelivered", handleMessageDelivered);
            socket.off("messageSeen", handleMessageSeen);
        };
    }, [conversationId]);

  useLayoutEffect(() => {
    if (!conversation || !conversation.participants) return;
        const others = conversation.participants.filter(
            (p) => p._id !== userId
        );
        const title = conversation.name
            ? conversation.name
            : others.length === 1
            ? others[0].username
            : others.map((u) => u.username).join(" & ");

        navigation.setOptions({
            title,
            headerRight: () =>
                conversation.participants.length > 2 ? (
                    <TouchableOpacity
                        onPress={() => setRenameModalVisible(true)}
                        style={{ marginRight: 10 }}
                    >
                        <Text style={{ fontSize: 18 }}>✏️</Text>
                    </TouchableOpacity>
                ) : null,
        });
    }, [conversation, userId]);

    const handleSend = async () => {
        if (!input.trim()) return;
        try {
            if (userData?.timesReported >= 3) {
                if (Platform.OS === "web") {
                    alert("Message Blocked: You have been reported and cannot send messages.");
                } else {
                   Alert.alert(
                    "Message Blocked",
                    "You have been reported and cannot send messages."
                    ); 
                }
                return;
            }
            const res = await API.post(
                `/conversations/${conversationId}/messages`,
                {
                    text: input,
                }
            );
            const message = res.data;
            const participantIds = new Set([
                message.sender._id,
                ...conversation.participants.map((p) => p._id),
            ]);
            socket.emit("sendMessage", {
                conversationId,
                message: { ...message, participants: [...participantIds] },
            });
            setMessages((prev) => [message, ...prev]);
            setInput("");
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const renderItem = ({ item }) => {
        const isOwnMessage = item.sender._id === userId;
        return (
            <View
                style={[
                    styles.messageWrapper,
                    isOwnMessage
                        ? styles.outgoingWrapper
                        : styles.incomingWrapper,
                ]}
            >
                {!isOwnMessage && (
                    <Text style={styles.senderLabel}>
                        {item.sender.username}
                    </Text>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.outgoing : styles.incoming,
                    ]}
                >
                    <Text style={styles.bubbleText}>{item.text}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })}
                        {isOwnMessage && (
                            <Text style={styles.deliveryStatus}>
                                {item.seenBy && item.seenBy.length > 1
                                    ? " ✓✓ Read"
                                    : item.deliveredTo &&
                                      item.deliveredTo.length >= 1
                                    ? " ✓ Delivered"
                                    : ""}
                            </Text>
                        )}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color="#28a745" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={styles.messagesContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.messageList}
                        inverted
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a message..."
                        style={styles.textInput}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        style={styles.sendButton}
                    >
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={renameModalVisible}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Rename Group</Text>
                        <TextInput
                            placeholder="Enter new name"
                            value={newTitle}
                            onChangeText={setNewTitle}
                            style={styles.input}
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                onPress={() => setRenameModalVisible(false)}
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                            >
                                <Text style={styles.modalButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        if (!newTitle.trim()) return;
                                        const res = await API.put(
                                            `/conversations/${conversationId}/rename`,
                                            {
                                                name: newTitle.trim(),
                                            }
                                        );
                                        setConversation(res.data);
                                        setRenameModalVisible(false);
                                        setNewTitle("");
                                    } catch (err) {
                                        console.error("Rename failed", err);
                                        if (Platform.OS === "web") {
                                            alert("Error: Failed to rename group");
                                        } else {
                                            Alert.alert(
                                            "Error",
                                            "Failed to rename group."
                                            );
                                        }
                                    }
                                }}
                                style={styles.modalButton}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    messagesContainer: {
        flex: 1,
        marginBottom: Platform.OS === "web" ? 130 : 110,
    },
    messageList: {
        padding: 10,
    },
    messageWrapper: {
        marginVertical: 5,
        maxWidth: "85%",
    },
    incomingWrapper: {
        alignSelf: "flex-start",
        alignItems: "flex-start",
    },
    outgoingWrapper: {
        alignSelf: "flex-end",
        alignItems: "flex-end",
    },
    messageBubble: {
        padding: 10,
        borderRadius: 8,
        flexShrink: 1,
    },
    incoming: {
        backgroundColor: "#f0f0f0",
        alignSelf: "flex-start",
    },
    outgoing: {
        backgroundColor: "#dcf8c6",
        alignSelf: "flex-end",
    },
    bubbleText: {
        fontSize: 16,
        ...(Platform.OS === "web" && { whiteSpace: "pre-wrap" }),
    },
    timestamp: {
        fontSize: 10,
        color: "#666",
        marginTop: 4,
        textAlign: "right",
        fontFamily: Platform.OS === "web" ? "monospace" : "System",
    },
    senderLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#444",
        marginBottom: 2,
    },
    inputContainer: {
        flexDirection: "row",
        padding: 10,
        borderTopColor: "#ccc",
        borderTopWidth: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        position: "absolute",
        bottom: Platform.OS === "web" ? 80 : 60,
        left: 0,
        right: 0,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
        fontSize: 16,
    },
    sendButton: {
        justifyContent: "center",
        paddingHorizontal: 15,
    },
    sendText: {
        color: "blue",
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalBox: {
        width: "85%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
    },
    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    modalButton: {
        backgroundColor: "#28a745",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    cancelButton: {
        backgroundColor: "#aaa",
    },
    modalButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    deliveryStatus: {
        fontSize: 10,
        color: "#666",
        fontStyle: "italic",
    },
});

export default ConversationDetailPage;
