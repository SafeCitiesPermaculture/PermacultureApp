import { useRouter } from "expo-router";
import React, { useContext, useState, useEffect } from "react";
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
import API from "@/api/api";

const LoginPage = () => {
    const router = useRouter();

    //access the login function from Auth
    const { login } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    //start the prod server as soon as possible
    useEffect(() => {
        startServer();
    }, []);

    const startServer = async () => {
        try {
            const res = await API.get("/start");
            console.log(res.data);
        } catch (err) {
            console.log("Error starting server", err);
        }
    };

    //handle submit
    const onSubmit = async () => {
        setMessage("");
        showLoading();
        try {
            await login(username, password);
        } catch (err) {
            console.log(err);
            setMessage(err.message);
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
            {message && <Text style={styles.errorMessage}>{message}</Text>}
            <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/signup")}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/forgotPassword")}>
                <Text style={styles.forgotPasswordText}>
                    Forgot your password?
                </Text>
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
        fontSize: 16,
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
    errorMessage: {
        color: "red",
        fontSize: 16,
        marginBottom: 10,
        textAlign: "center",
    },
    forgotPasswordText: {
        color: "blue",
        textDecorationLine: "underline",
    },
});

export default LoginPage;
