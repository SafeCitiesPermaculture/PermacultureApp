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
import { useLoading } from "@/context/LoadingContext";

const LoginPage = () => {
    const router = useRouter();

    //access the login function from Auth
    const { login } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    //handle submit
    const onSubmit = async () => {
        try {
            showLoading();
            await login(username, password);
        } catch (err) {
            console.log("Login failed:", err);
        } finally {
            hideLoading();
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
            <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/signup")}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.backgroundTan,
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
    button: {
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    buttonText: {
        fontSize: 20,
    },
});

export default LoginPage;
