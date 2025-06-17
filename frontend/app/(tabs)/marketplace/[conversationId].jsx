import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
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
import Colors from "@/constants/Colors";

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

    useEffect(() => {
        let active = true;
        let uid = null;

        const handleReceiveMessage = (message) => {
            if (!active) return;
            setMessages((prev) => [message, ...prev]);
            if (userId) {
                socket.emit("messageDelivered", {
                    messageId: message._id,
                    userId: userId,
                });
            }
        };

        const handleMessageDelivered = ({ messageId, userId }) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId && !msg.deliveredTo.includes(userId)
                        ? { ...msg, deliveredTo: [...msg.deliveredTo, userId] }
                        : msg
                )
            );
        };

        const init = async () => {
            try {
                uid = await getUserIdFromToken();
                setUserId(uid);

                socket.emit("joinConversation", conversationId);

                const res = await API.get(
                    `/conversations/${conversationId}/messages`
                );
                setMessages(res.data.reverse());

                const convoRes = await API.get(
                    `/conversations/${conversationId}`
                );
                setConversation(convoRes.data);

                const participants = convoRes.data.participants;
                const other = participants.find((p) => p._id !== uid);
                if (other) setOtherUser(other);

                socket.on("receiveMessage", handleReceiveMessage);
                socket.on("messageDelivered", handleMessageDelivered);
            } catch (err) {
                console.error("Error loading conversation:", err);
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => {
            active = false;
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("messageDelivered", handleMessageDelivered);
        };
    }, [conversationId]);

    useLayoutEffect(() => {
        if (!conversation || !conversation.participants) return;
        const otherUsers = conversation.participants.filter(
            (p) => p._id !== userId
        );
        const title = conversation.name
            ? conversation.name
            : otherUsers.length === 1
            ? otherUsers[0].username
            : otherUsers.map((u) => u.username).join(" & ");

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
            const emitPayload = {
                conversationId,
                message: {
                    ...message,
                    participants: [...participantIds],
                },
            };
            socket.emit("sendMessage", emitPayload);
            setMessages((prev) => [message, ...prev]);
            setInput("");
        } catch (err) {
            console.error("❌ Failed to send message", err);
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
                    <Text>{item.text}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })}
                        {isOwnMessage &&
                            (item.seenBy.length > 1
                                ? " ✓✓ Read"
                                : item.deliveredTo.length >= 1
                                ? " ✓ Delivered"
                                : "")}
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
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 70}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.messageList}
                    inverted
                />
                <View style={[styles.inputContainer]}>
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
                                        Alert.alert(
                                            "Error",
                                            "Failed to rename group."
                                        );
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
    container: { flex: 1 },
    messageList: {
        padding: 10,
    },
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
        marginBottom: 80,
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
    messageWrapper: {
        marginVertical: 5,
        maxWidth: "80%",
    },
    incomingWrapper: {
        alignSelf: "flex-start",
        alignItems: "flex-start",
    },
    outgoingWrapper: {
        alignSelf: "flex-end",
        alignItems: "flex-end",
    },
    senderLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#444",
        marginBottom: 2,
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
});

export default ConversationDetailPage;
