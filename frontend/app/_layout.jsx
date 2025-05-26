import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import Colors from "@/constants/Colors";

/**
 * Sets up navigation and Auth for all pages
 */
const RootLayout = () => {
    return (
        <AuthProvider>
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
                <Stack.Screen name="index" options={{ title: "Home" }} />
                <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
                <Stack.Screen
                    name="signup"
                    options={{ headerTitle: "Sign Up" }}
                />
                <Stack.Screen
                    name="protected"
                    options={{ headerTitle: "Protected" }}
                />
                <Stack.Screen name="admin" options={{ headerTitle: "Admin" }} />
            </Stack>
        </AuthProvider>
    );
};

export default RootLayout;
