import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import colors from "@/constants/Colors.js";
import { AI_API } from "@/api/api";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.72;

function createSession(title = "New Chat") {
    return {
        id: Date.now().toString(),
        title,
        messages: [],
        savedAt: null,
    };
}

export default function ChatbotScreen() {
    const [sessions, setSessions] = useState([createSession("New Chat")]);
    const [savedSessionIds, setSavedSessionIds] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(sessions[0].id);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [attachedImage, setAttachedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const flatListRef = useRef(null);

    const currentSession = sessions.find((s) => s.id === currentSessionId);

    const openSidebar = () => {
        setSidebarOpen(true);
        Animated.timing(sidebarAnim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
        }).start();
    };

    const closeSidebar = () => {
        Animated.timing(sidebarAnim, {
            toValue: -SIDEBAR_WIDTH,
            duration: 260,
            useNativeDriver: true,
        }).start(() => setSidebarOpen(false));
    };

    const toggleSidebar = () => (sidebarOpen ? closeSidebar() : openSidebar());

    const startNewChat = () => {
        const s = createSession("New Chat");
        setSessions((prev) => [...prev, s]);
        setCurrentSessionId(s.id);
        closeSidebar();
    };

    const switchSession = (id) => {
        setCurrentSessionId(id);
        closeSidebar();
    };

    const saveCurrentSession = () => {
        if (!currentSession?.messages?.length) {
            Alert.alert("Nothing to save", "Start a conversation first.");
            return;
        }
        setSessions((prev) =>
            prev.map((s) =>
                s.id === currentSessionId
                    ? {
                          ...s,
                          savedAt: new Date().toLocaleString(),
                          title:
                              s.messages[0]?.text?.slice(0, 30) || "Saved Chat",
                      }
                    : s
            )
        );
        setSavedSessionIds((prev) =>
            prev.includes(currentSessionId) ? prev : [...prev, currentSessionId]
        );
        Alert.alert("Saved", "Conversation saved.");
    };

    const deleteSession = (id) => {
        Alert.alert("Delete chat?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    setSessions((prev) => {
                        const updated = prev.filter((s) => s.id !== id);
                        if (updated.length === 0) {
                            const fresh = createSession("New Chat");
                            setCurrentSessionId(fresh.id);
                            return [fresh];
                        }
                        if (id === currentSessionId) {
                            setCurrentSessionId(updated[updated.length - 1].id);
                        }
                        return updated;
                    });
                    setSavedSessionIds((prev) => prev.filter((i) => i !== id));
                },
            },
        ]);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Please allow access to your photos.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) {
            setAttachedImage(result.assets[0].uri);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() && !attachedImage) return;

        const userMsg = {
            id: Date.now().toString(),
            role: "user",
            text: inputText.trim(),
            image: attachedImage,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setSessions((prev) =>
            prev.map((s) =>
                s.id === currentSessionId
                    ? { ...s, messages: [...s.messages, userMsg] }
                    : s
            )
        );
        setInputText("");
        setAttachedImage(null);
        setIsLoading(true);

        try {
            // Prior turns become history; the new message is sent separately.
            const history = currentSession.messages.map((m) => ({
                role: m.role,
                content: m.text,
            }));

            // Calls the FastAPI AI service (Gemini 2.5 Flash + Drive File Search
            // RAG). Auth + the provider key are handled server-side via AI_API.
            const { data } = await AI_API.post("/chat", {
                message: userMsg.text || "(image attached)",
                history,
                // Let the assistant see the user's open schedule tasks.
                include_tasks: true,
            });

            let replyText =
                data?.reply || "Sorry, I couldn't generate a response.";
            // Surface the Drive documents the answer was grounded in.
            if (data?.sources?.length) {
                const cited = data.sources
                    .map((s) => s.title)
                    .filter(Boolean)
                    .join(", ");
                if (cited) replyText += `\n\n📄 Sources: ${cited}`;
            }

            const assistantMsg = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: replyText,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setSessions((prev) =>
                prev.map((s) =>
                    s.id === currentSessionId
                        ? { ...s, messages: [...s.messages, assistantMsg] }
                        : s
                )
            );
        } catch (err) {
            const errMsg = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: "Something went wrong. Please check your connection and try again.",
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setSessions((prev) =>
                prev.map((s) =>
                    s.id === currentSessionId
                        ? { ...s, messages: [...s.messages, errMsg] }
                        : s
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (flatListRef.current && currentSession?.messages?.length) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [currentSession?.messages]);

    const renderMessage = ({ item }) => {
        const isUser = item.role === "user";
        return (
            <View style={[styles.messageBubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
                {!isUser && (
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>🌿</Text>
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                    {item.image && (
                        <Image source={{ uri: item.image }} style={styles.attachedImage} />
                    )}
                    {item.text ? (
                        <Text style={isUser ? styles.userText : styles.assistantText}>
                            {item.text}
                        </Text>
                    ) : null}
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
            </View>
        );
    };

    const savedSessions = sessions.filter((s) => savedSessionIds.includes(s.id));
    const recentSessions = sessions.filter((s) => !savedSessionIds.includes(s.id));

    const sidebarData = [
        ...(savedSessions.length
            ? [{ type: "header", id: "saved-header", label: "Saved" },
               ...savedSessions.map((s) => ({ type: "session", ...s }))]
            : []),
        ...(recentSessions.length
            ? [{ type: "header", id: "recent-header", label: "Recent" },
               ...recentSessions.map((s) => ({ type: "session", ...s }))]
            : []),
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {sidebarOpen && (
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={closeSidebar}
                />
            )}

            <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.sidebarHeader}>
                        <Text style={styles.sidebarTitle}>Chats</Text>
                        <TouchableOpacity onPress={startNewChat} style={styles.newChatBtn}>
                            <Text style={styles.newChatBtnText}>＋ New</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={sidebarData}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            if (item.type === "header") {
                                return <Text style={styles.sectionLabel}>{item.label}</Text>;
                            }
                            const isActive = item.id === currentSessionId;
                            return (
                                <TouchableOpacity
                                    style={[styles.sessionItem, isActive && styles.activeSessionItem]}
                                    onPress={() => switchSession(item.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sessionTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        {item.savedAt && (
                                            <Text style={styles.savedAt}>{item.savedAt}</Text>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => deleteSession(item.id)}
                                        style={styles.deleteBtn}
                                    >
                                        <Text style={styles.deleteBtnText}>✕</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </SafeAreaView>
            </Animated.View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
                        <Text style={styles.menuBtnText}>☰</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Farm Assistant</Text>
                    <TouchableOpacity onPress={saveCurrentSession} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>

                {currentSession?.messages?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🌱</Text>
                        <Text style={styles.emptyTitle}>Farm Assistant</Text>
                        <Text style={styles.emptySubtitle}>
                            Ask me anything about permaculture, crop planning, soil health,
                            and sustainable farming.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={currentSession.messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {isLoading && (
                    <View style={styles.loadingRow}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>🌿</Text>
                        </View>
                        <View style={styles.loadingBubble}>
                            <ActivityIndicator size="small" color={colors.menuBrown} />
                            <Text style={styles.loadingText}>Thinking…</Text>
                        </View>
                    </View>
                )}

                {attachedImage && (
                    <View style={styles.imagePreviewRow}>
                        <Image source={{ uri: attachedImage }} style={styles.imagePreview} />
                        <TouchableOpacity
                            onPress={() => setAttachedImage(null)}
                            style={styles.removeImageBtn}
                        >
                            <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputBar}>
                    <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                        <Text style={styles.attachIcon}>📷</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Message Farm Assistant…"
                        placeholderTextColor="#999"
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={[
                            styles.sendBtn,
                            !inputText.trim() && !attachedImage && styles.sendBtnDisabled,
                        ]}
                        disabled={!inputText.trim() && !attachedImage}
                    >
                        <Text style={styles.sendBtnText}>↑</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#FCFBF4" },
    flex: { flex: 1 },

    overlay: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        zIndex: 10,
    },

    sidebar: {
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: "#FCFBF4",
        zIndex: 20,
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 10,
    },
    sidebarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#F3EADD",
    },
    sidebarTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
    newChatBtn: {
        backgroundColor: "#AEBA8C",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        elevation: 2,
    },
    newChatBtnText: { fontSize: 13, fontWeight: "bold", color: "#000" },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#A09A7C",
        textTransform: "uppercase",
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
    },
    sessionItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3EADD",
        flexDirection: "row",
        alignItems: "center",
    },
    activeSessionItem: { backgroundColor: "#F3EADD" },
    sessionTitle: { fontSize: 14, color: "#333" },
    savedAt: { fontSize: 10, color: "#A09A7C", marginTop: 2 },
    deleteBtn: { padding: 4 },
    deleteBtnText: { color: "#A09A7C", fontSize: 13 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#A09A7C",
    },
    menuBtn: { padding: 6 },
    menuBtnText: { fontSize: 22, color: "#fff" },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    saveBtn: {
        backgroundColor: "rgba(255,255,255,0.22)",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    saveBtnText: { fontSize: 14, fontWeight: "bold", color: "#fff" },

    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        backgroundColor: "#FCFBF4",
    },
    emptyEmoji: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#000", marginBottom: 8 },
    emptySubtitle: {
        fontSize: 16,
        color: "#A09A7C",
        textAlign: "center",
        lineHeight: 22,
    },

    messageList: { padding: 12, paddingBottom: 8, backgroundColor: "#FCFBF4" },
    messageBubbleRow: {
        flexDirection: "row",
        marginBottom: 10,
        alignItems: "flex-end",
    },
    userRow: { justifyContent: "flex-end" },
    assistantRow: { justifyContent: "flex-start" },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F3EADD",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
        marginBottom: 2,
    },
    avatarText: { fontSize: 16 },
    bubble: {
        maxWidth: "78%",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: "#A09A7C",
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: "#F3EADD",
        borderBottomLeftRadius: 4,
    },
    userText: { color: "#fff", fontSize: 16, lineHeight: 22 },
    assistantText: { color: "#000", fontSize: 16, lineHeight: 22 },
    timestamp: {
        fontSize: 10,
        color: "rgba(0,0,0,0.4)",
        marginTop: 4,
        alignSelf: "flex-end",
    },
    attachedImage: {
        width: 180,
        height: 130,
        borderRadius: 10,
        marginBottom: 6,
    },

    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 4,
        backgroundColor: "#FCFBF4",
    },
    loadingBubble: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3EADD",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
    },
    loadingText: { fontSize: 14, color: "#A09A7C" },

    imagePreviewRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 4,
        backgroundColor: "#FCFBF4",
    },
    imagePreview: {
        width: 56,
        height: 56,
        borderRadius: 8,
        marginRight: 6,
    },
    removeImageBtn: {
        backgroundColor: "#F3EADD",
        borderRadius: 12,
        width: 22,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    removeImageText: { fontSize: 11, color: "#A09A7C" },

    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 10,
        paddingVertical: 10,
        paddingBottom: Platform.OS === "ios" ? 8 : 8,
        marginBottom: 60,
        backgroundColor: "#FCFBF4",
        borderTopWidth: 1,
        borderTopColor: "#F3EADD",
        gap: 8,
    },
    attachBtn: { padding: 6, justifyContent: "center", alignItems: "center" },
    attachIcon: { fontSize: 22 },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        backgroundColor: "#D9D9D9",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 15,
        color: "#333",
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#AEBA8C",
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    sendBtnDisabled: { backgroundColor: "#D9D9D9" },
    sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: -1 },
});