import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext.js";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";
import Colors from "@/constants/Colors";

const LoginPage = () => {
    const router = useRouter();

    //access the login function from Auth
    const { login } = useContext(AuthContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    //handle submit
    const onSubmit = async () => {
        try {
            await login(username, password);
            router.dismissTo("/protected");
        } catch (err) {
            console.log("Login failed", err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Login</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Username..."
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.textInput}
                placeholder="Password..."
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.backgroundWhite,
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
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 10,
    },
    submitButtonText: {
        fontSize: 20,
    },
});

export default LoginPage;
