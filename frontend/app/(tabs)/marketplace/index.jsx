import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
} from "react-native";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import ListingCard from "@/components/ListingCard";

const MarketplacePage = () => {
    const router = useRouter();

    const chatButton = require("@/assets/images/chat-button.png");
    const postButton = require("@/assets/images/post-button.png");

    return (
        <AuthGuard>
            <View style={styles.header}>
                <View style={{ flex: 1 }} />
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Marketplace</Text>
                </View>
                <View style={styles.chatContainer}>
                    <TouchableOpacity
                        onPress={() => router.push("/marketplace/chats")}
                    >
                        <Image
                            source={chatButton}
                            style={{ height: 35, width: 35 }}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.listingArea}>
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />

                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />

                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
                <ListingCard title="Carrots" price={120} postedBy="Param" />
            </ScrollView>

            <TouchableOpacity
                onPress={() => router.push("/marketplace/post")}
                style={styles.postButton}
            >
                <Image source={postButton} style={{ height: 50, width: 50 }} />
            </TouchableOpacity>
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: -1,
        flexDirection: "row",
        paddingTop: 5,
        paddingBottom: 20,
        backgroundColor: Colors.backgroundTan,
    },
    titleContainer: {
        flex: 2,
        justifyContent: "center",
        flexDirection: "row",
        backgroundColor: Colors.backgroundTan,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
    },
    chatContainer: {
        flex: 1,
        justifyContent: "flex-end",
        flexDirection: "row",
    },
    chatButton: {
        paddingTop: 5,
        paddingRight: 5,
    },
    postButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "transparent",
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    listingArea: {
        backgroundColor: Colors.backgroundTan,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
    },
});

export default MarketplacePage;
