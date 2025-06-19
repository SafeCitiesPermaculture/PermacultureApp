import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";
import Colors from "@/constants/Colors";
import API from "@/api/api";
import { useLoading } from "@/context/LoadingContext";
import PasswordInput from "@/components/PasswordInput";

const SignupPage = () => {
    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [positiveMessage, setPositiveMessage] = useState(false);

    //handle submit
    const onSubmit = async () => {
        // Input validity checks
        if (!username.trim()) {
            setErrorMessage("Missing username");
            setPositiveMessage(false);
            return;
        }

        if (!email.trim()) {
            setErrorMessage("Missing email");
            setPositiveMessage(false);
            return;
        }

        if (!password.trim()) {
            setErrorMessage("Missing password");
            setPositiveMessage(false);
            return;
        }

        if (!confirmPassword.trim()) {
            setErrorMessage("Missing password confirmation");
            setPositiveMessage(false);
            return;
        }

        if (username.length < 5) {
            setErrorMessage("Username must be at least 5 characters long");
            setPositiveMessage(false);
            return;
        }
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        if (!alphanumericRegex.test(username)) {
            setErrorMessage("Username must only be letters and numbers");
            setPositiveMessage(false);
            return;
        }

        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            setErrorMessage("Email not valid");
            setPositiveMessage(false);
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters long");
            setPositiveMessage(false);
            return;
        }

        if (!/[a-z]/.test(password)) {
            setErrorMessage("Password must have at least one lowercase letter");
            setPositiveMessage(false);
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setErrorMessage("Password must have at least one capital letter");
            setPositiveMessage(false);
            return;
        }

        const specialCharRegex = /[^A-Za-z0-9]/;
        if (!specialCharRegex.test(password)) {
            setErrorMessage(
                "Password must have at least one special character (e.g. !, @, $, etc.) in it"
            );
            setPositiveMessage(false);
            return;
        }

        if (password != confirmPassword) {
            setErrorMessage("Passwords do not match");
            setPositiveMessage(false);
            return;
        }

        try {
            showLoading();
            const res = await API.post("/auth/signup", {
                username,
                password,
                email,
            });
            if (res.status == 201) {
                setErrorMessage(
                    "Wait for an admin to approve you before logging in."
                );
                setPositiveMessage(true);
                setTimeout(() => router.dismissTo("/login"), 10000);
            }
        } catch (err) {
            console.log("Sign Up failed", err);
            if (err.status == 409) {
                setErrorMessage(err.response?.data?.message);
                setPositiveMessage(false);
            }
        } finally {
            hideLoading();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Sign Up</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Username..."
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.textInput}
                placeholder="Email..."
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />
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
            <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            {errorMessage && (
                <Text
                    style={[
                        styles.errorMessage,
                        positiveMessage && styles.positiveMessage,
                    ]}
                >
                    {errorMessage}
                </Text>
            )}
            <View style={{ flexDirection: "row", marginTop: 5 }}>
                <Text>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                    <Text
                        style={{
                            color: "blue",
                            textDecorationLine: "underline",
                        }}
                    >
                        Log in here!
                    </Text>
                </TouchableOpacity>
            </View>
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
        fontSize: 16,
        color: "red",
        marginTop: 5,
        textAlign: "center",
    },
    positiveMessage: { color: "green" },
    passwordDescription: {
        textAlign: "center",
        marginBottom: 8,
        marginHorizontal: 10,
    },
});

export default SignupPage;
