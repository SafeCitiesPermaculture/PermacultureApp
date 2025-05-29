import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import API from "@/api/api";
import { useRouter } from "expo-router";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken.js";

const ConversationsPage = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            try {
                const uid = await getUserIdFromToken();
                setUserId(uid);

                const res = await API.get("/conversations"); // updated route
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
                    {new Date(item.updatedAt).toLocaleString()}
                </Text>
            </TouchableOpacity>
        );
    };

    // if (loading) {
    //     console.log("Still loading...");
    //     return (
    //         <View style={styles.container}>
    //             <ActivityIndicator size="large" />
    //         </View>
    //     );
    // }

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
});

export default ConversationsPage;
