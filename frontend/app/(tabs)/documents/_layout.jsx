import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const DocumentsLayout = () => {
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
            <Stack.Screen name="index" options={{ title: "Documents" }} />
        </Stack>
    );
};

export default DocumentsLayout;
