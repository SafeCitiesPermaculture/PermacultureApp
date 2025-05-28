import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const ProfileLayout = () => {
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
            <Stack.Screen name="index" options={{ title: "Profile" }} />
            <Stack.Screen name="admin" options={{ title: "Admin" }} />
            <Stack.Screen
                name="approval"
                options={{ title: "Admin Approval" }}
            />
        </Stack>
    );
};

export default ProfileLayout;
