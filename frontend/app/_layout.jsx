import { Stack } from "expo-router";

const RootLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#fff",
                },
                headerTintColor: "#000",
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                },
                contentStyle: {
                    paddingHorizontal: 10,
                    paddingTop: 10,
                    backgroundColor: "#fff",
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Home" }} />
            <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
            <Stack.Screen
                name="protected"
                options={{ headerTitle: "Protected" }}
            />
        </Stack>
    );
};

export default RootLayout;
