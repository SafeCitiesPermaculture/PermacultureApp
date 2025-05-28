import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const MarketplaceLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.brownDark,
                },
                headerTintColor: "#000",
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                },
                contentStyle: {
                    paddingHorizontal: 10,
                    paddingTop: 10,
                    backgroundColor: Colors.backgroundWhite,
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Marketplace" }} />
            <Stack.Screen name="post" options={{ title: "Add a Post" }} />
        </Stack>
    );
};

export default MarketplaceLayout;
