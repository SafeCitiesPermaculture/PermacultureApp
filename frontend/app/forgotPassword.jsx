import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import API from "@/api/api";
import Colors from "@/constants/Colors";

const forgotPasswordPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async () => {
        if (!username.trim() || !email.trim()) {
            setMessage("Username and email required");
            return;
        }

        if (username.length < 5) {
            setMessage("Invalid username");
            return;
        }

        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            setMessage("Invalid email");
            return;
        }
        
        if (emailSent) {
            setMessage("Email already sent");
            return;
        }

        setMessage("");
        setLoading(true);
        try {
            const response = await API.put("/auth/reset-password", {
                username: username.trim(),
                email: email.trim()
            });

            console.log(response);
            if (response.status !== 200) {
                setMessage("No user found");
            } else {
                setEmailSent(true);
                setMessage("Check email for reset password link");
            }
            
        } catch (error) {
            setMessage(error.message);
            console.log(error.response);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Forgot Password</Text>
            <TextInput 
                style={styles.textInput}
                placeholder="Username..."
                value={username}
                onChangeText={setUsername}
                autoCapitalize='none'
                />
            <TextInput
                style={styles.textInput}
                placeholder="Email..."
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                />
            {message && <Text style={styles.message}>{message}</Text>}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator size="large" color={Colors.greenRegular} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    header: {
        fontSize: 30
    },
    textInput: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: "90%",
    },
    message: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 10
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

export default forgotPasswordPage;