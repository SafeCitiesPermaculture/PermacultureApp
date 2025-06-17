import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import React, { useState, useCallback } from "react";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import { useLocalSearchParams, useRouter } from "expo-router";

const ResetPasswordPage = () => {
    const { resetPasswordToken } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    const handleSubmit = useCallback(async () => {
        // Data validation
        if (!password.trim()) {
            setErrorMessage("Missing password");
            return;
        }

        if (!confirmPassword.trim()) {
            setErrorMessage("Missing password confirmation");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters long");
            return;
        }

        if (!/[a-z]/.test(password)) {
            setErrorMessage("Password must have at least one lowercase letter");
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setErrorMessage("Password must have at least one capital letter");
            return;
        }

        const specialCharRegex = /[^A-Za-z0-9]/;
        if (!specialCharRegex.test(password)) {
            setErrorMessage(
                "Password must have at least one special character (e.g. !, @, $, etc.) in it"
            );
            return;
        }

        if (password != confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        setErrorMessage("");
        setLoading(true);
        try {
            const response = await API.put(
                `/auth/reset-password/${resetPasswordToken}`,
                {
                    newPassword: password,
                }
            );
            if (response.status === 201) {
                setErrorMessage("Reset password successfully");
                setTimeout(() => router.replace("/login"), 2000);
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [password, confirmPassword, resetPasswordToken]);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Reset Password</Text>
            <TextInput
                placeholder="New password..."
                value={password}
                onChangeText={setPassword}
                style={styles.textInput}
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Confirm new password..."
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.textInput}
                autoCapitalize="none"
            />
            {errorMessage && (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            )}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Reset password</Text>
            </TouchableOpacity>
            {loading && (
                <ActivityIndicator size="large" color={Colors.greenRegular} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        alignItems: "center",
        fontSize: 32,
    },
    textInput: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: "90%",
        fontSize: 16,
    },
    errorMessage: {
        fontSize: 16,
        color: "red",
        textAlign: "center",
        marginBottom: 10,
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

export default ResetPasswordPage;
