import { Tabs } from "expo-router";
import Colors from "@/constants/Colors";
import AuthGuard from "@/components/AuthGuard";

/**
 * Sets up navigation and Auth for all pages
 */
const TabLayout = () => {
    return (
        <AuthGuard>
            <Tabs
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: Colors.brownDark,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{ title: "Home", headerShown: false }}
                />
                <Tabs.Screen
                    name="protected"
                    options={{ title: "Protected", headerShown: false }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{ title: "Profile", headerShown: false }}
                />
            </Tabs>
        </AuthGuard>
    );
};

export default TabLayout;
