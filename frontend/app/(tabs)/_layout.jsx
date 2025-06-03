import React from "react";
import { Tabs } from "expo-router";
import AuthGuard from "@/components/AuthGuard";
import Menu from "@/components/Menu";

/**
 * Sets up navigation and Auth for all pages
 */
export default function TabLayout() {
    return (
        <AuthGuard>
            <Tabs
                screenOptions={{
                    headerShown: false,
                }}
                tabBar={(props) => <Menu {...props} />} // Spread props to ensure proper tab behavior
            >
                <Tabs.Screen name="home" />
                <Tabs.Screen name="information" />
                <Tabs.Screen name="marketplace" />
                <Tabs.Screen name="profile" />
                <Tabs.Screen name="schedule" />
            </Tabs>
        </AuthGuard>
    );
}
