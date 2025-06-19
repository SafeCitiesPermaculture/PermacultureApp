import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import React, { useState, useCallback } from "react";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import PasswordInput from "@/components/PasswordInput";
import { useLoading } from "@/context/LoadingContext";

const ResetPasswordPage = () => {
    const { resetPasswordToken } = useLocalSearchParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

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
        showLoading();
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
            hideLoading();
        }
    }, [password, confirmPassword, resetPasswordToken]);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Reset Password</Text>
            <PasswordInput
                value={password}
                onChangeText={setPassword}
                style={{width: "90%"}}
                />
            <PasswordInput
                style={{width:"90%"}}
                placeholder="Confirm password..."
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            <Text style={styles.passwordDescription}>
                Passwords must be 8+ characters, contain at least one uppercase
                letter, number, and special character (e.g. !, @, $)
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Reset password</Text>
            </TouchableOpacity>
            {errorMessage && (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
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
    passwordDescription: {
        textAlign: "center",
        marginBottom: 8,
        marginHorizontal: 10,
    },
});

export default ResetPasswordPage;
