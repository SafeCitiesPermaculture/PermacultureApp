import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useCallback } from "react";
import { useLoading } from "@/context/LoadingContext";
import DeleteModal from "@/components/DeleteModal";
import PasswordInput from "@/components/PasswordInput";

const ResetPasswordPage = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const { showLoading, hideLoading } = useLoading();

    const resetPassword = useCallback(async () => {
        setErrorMessage("");
        showLoading();
        setLoading(true);
        try {
            await API.put("/user/change-password", {
                oldPassword,
                newPassword,
            });
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message);
        } finally {
            hideLoading();
            setConfirmModalVisible(false);
            setLoading(false);
        }
    }, []);

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

        setConfirmModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <PasswordInput
                style={{width:"90%"}}
                placeholder="Old password..."
                value={oldPassword}
                onChangeText={setOldPassword}
                />
            <PasswordInput
                style={{width:"90%"}}
                placeholder="New password..."
                value={newPassword}
                onChangeText={setNewPassword}
                />
            <PasswordInput
                style={{width: "90%"}}
                placeholder="Confirm new password..."
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
            {loading && (
                <ActivityIndicator size="large" color={Colors.greenButton} />
            )}
            {errorMessage && (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            )}
            <DeleteModal
                isVisible={confirmModalVisible}
                title="Change password"
                message="Are you sure you want to change your password?"
                onConfirm={() => resetPassword()}
                onCancel={() => {
                    setConfirmModalVisible(false);
                }}
                isLoading={loading}
                />
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
