import { Tabs } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import Colors from "@/constants/Colors";

/**
 * Sets up navigation and Auth for all pages
 */
const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: Colors.brownDark,
                },
            }}
        >
            <Tabs.Screen
                name="protected"
                options={{ title: "Protected", headerShown: false }}
            />
            <Tabs.Screen
                name="admin"
                options={{ title: "Admin", headerShown: false }}
            />
        </Tabs>
    );
};

export default TabLayout;
