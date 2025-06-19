import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const ProfileLayout = () => {
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
            <Stack.Screen name="index" options={{ title: "Profile" }} />
            <Stack.Screen name="admin" options={{ title: "Admin" }} />
            <Stack.Screen
                name="approval"
                options={{ title: "Admin Approval" }}
            />
            <Stack.Screen name="manageUsers" options={{ title: "Users" }} />
            <Stack.Screen
                name="user/[userId]"
                options={{ title: "Manage User" }}
            />
            <Stack.Screen name="user/change-password" options={{ title: "Change Password"}} />
            <Stack.Screen name="user/change-email" options={{ title: "Change Email"}} />
            <Stack.Screen name="user/change-username" options={{ title: "Change Username"}} />
            <Stack.Screen name="user/change-farm" options={{ title: "Change Farm"}} />
            <Stack.Screen name="reports" options={{ title: "Reports" }} />
            <Stack.Screen name="[reportId]" options={{ title: "Report" }} />
        </Stack>
    );
};

export default ProfileLayout;
