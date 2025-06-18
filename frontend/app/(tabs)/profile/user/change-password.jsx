import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState } from "react";
import { Stack } from "expo-router";

const ResetPasswordPage = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const changePassword = async () => {
        setLoading(true);
        try {
            await API.put("/user/change-password", {
                oldPassword,
                newPassword
            });
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Error changing password");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setErrorMessage("");
        //Validate passwords
        if (!oldPassword) {
            setErrorMessage("Missing old password");
            return;
        }

        if (!newPassword) {
            setErrorMessage("Missing new password");
            return;
        }

        if (!confirmNewPassword) {
            setErrorMessage("Missing new password confirmation");
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage("Password must be at least 8 characters long");
            return;
        }

        if (!/[a-z]/.test(newPassword)) {
            setErrorMessage("Password must have at least one lowercase letter");
            return;
        }

        if (!/[A-Z]/.test(newPassword)) {
            setErrorMessage("Password must have at least one uppercase letter");
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            setErrorMessage("Password must have at least one number");
            return;
        }

        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            setErrorMessage(
                "Password must have at least one special character (e.g. !, @, $, etc.) in it"
            );
            return;
        }

        if (oldPassword === newPassword) {
            setErrorMessage("New password must be different from old password");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        if (Platform.OS === "web") {
            changePassword();
            return;
        }
        Alert.alert(
        "Change password",
        "Are you sure you want to change your password?",
        [
            { text: "Cancel", style:"cancel" },
            { 
                text: "Change Password", style: "destructive",
                onPress: changePassword
            }
        ],
        { cancelable: true }
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Change Password" }} />
            <TextInput
                style={styles.textInput}
                placeholder="Old password..."
                secureTextEntry={true}
                value={oldPassword}
                onChangeText={setOldPassword}
            />
            <TextInput
                style={styles.textInput}
                placeholder="New password..."
                secureTextEntry={true}
                value={newPassword}
                onChangeText={setNewPassword}
            />
            <TextInput
                style={styles.textInput}
                placeholder="Confirm new password..."
                secureTextEntry={true}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
            />
            <Text style={styles.passwordDescription}>
                Passwords must be 8+ characters, contain at least one uppercase
                letter, number, and special character (e.g. !, @, $)
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
            {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
            {loading && <ActivityIndicator size="large" color={Colors.greenButton} />}
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
    textInput: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: "90%",
        fontSize: 16,
    },
    passwordDescription: {
        textAlign: "center",
        marginBottom: 8,
        marginHorizontal: 10,
    },
    errorMessage: {
        fontSize: 16,
        color: "red",
        marginTop: 5,
        textAlign: "center",
    },
    button: {
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        marginTop: 10,
    },
    buttonText: {
        fontSize: 20,
    },
});

export default ResetPasswordPage;
