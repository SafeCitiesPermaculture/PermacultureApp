import { Text, View, Button } from "react-native";
import { useRouter, Redirect } from "expo-router";

const Index = () => {
    const router = useRouter();

    return <Redirect href={"/login"} />;

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text>Edit app/index.jsx to edit this screen.</Text>
            <Button onPress={() => router.push("/login")} title="Login">
                <Text>Login</Text>
            </Button>
        </View>
    );
};

export default Index;
