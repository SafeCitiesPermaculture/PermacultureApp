import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const MarketplaceLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.menuBrown,
                },
                headerTintColor: "#000",
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                },
                contentStyle: {
                    paddingHorizontal: 10,
                    paddingTop: 10,
                    backgroundColor: Colors.backgroundTan,
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Marketplace" }} />
            <Stack.Screen name="post" options={{ title: "Add a Post" }} />
            <Stack.Screen name="messages" options={{ title: "Messages" }} />
            <Stack.Screen name="[conversationId]" options={{ title: "Chat" }} />
            <Stack.Screen name="my-listings" options={{ title: "My Listings" }} />
            <Stack.Screen name="listing/[listingId]" options={{ title: "Listing" }} />
        </Stack>
    );
};

export default MarketplaceLayout;
