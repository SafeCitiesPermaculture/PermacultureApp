import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";

const LoginPage = () => {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = () => {
        router.dismissTo("/protected");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Login</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Username..."
                value={username}
                onChange={setUsername}
            />
            <TextInput
                style={styles.textInput}
                placeholder="Password..."
                secureTextEntry={true}
                value={password}
                onChange={setPassword}
            />
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        fontSize: 30,
    },
    textInput: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: "90%",
    },
    submitButton: {
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 10,
    },
    submitButtonText: {
        fontSize: 20,
    },
});

export default LoginPage;
