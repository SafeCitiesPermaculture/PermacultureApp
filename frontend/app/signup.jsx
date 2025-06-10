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

const SignupPage = () => {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    //handle submit
    const onSubmit = async () => {
        // Input validity checks
        if (!username.trim()) {
            setErrorMessage("Missing username");
            return;
        }

        if (!email.trim()) {
            setErrorMessage("Missing email")
            return;
        }

        if (!password.trim()) {
            setErrorMessage("Missing password");
            return;
        }

        if (!confirmPassword.trim()) {
            setErrorMessage("Missing password confirmation");
            return;
        }

        if (username.length < 5) {
            setErrorMessage("Username must be at least 5 characters long");
            return;
        }
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        if (!alphanumericRegex.test(username)) {
            setErrorMessage("Username must only be letters and numbers");
            return;
        }

        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            setErrorMessage("Email not valid");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters long");
            return;
        }

        if (!/[a-z]/.test(password)) {
            setErrorMessage("Password must have at least one lowercase letter");
            return
        }

        if (!/[A-Z]/.test(password)) {
            setErrorMessage("Password must have at least one capital letter");
            return;
        }

        const specialCharRegex = /[^A-Za-z0-9]/;
        if (!specialCharRegex.test(password)){
            setErrorMessage("Password must have at least one special character (e.g. !, @, $, etc.) in it")
            return;
        }

        if (password != confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        try {
            const res = await API.post("/auth/signup", {
                username,
                password,
                email,
            });
            if (res.status == 201) {
                setErrorMessage("Wait for an admin to approve you before logging in.");
                setTimeout(() => router.dismissTo("/login"), 10000);
            } else {
                console.log("Error in signup");
            }
        } catch (err) {
            console.log("Sign Up failed", err);
            if (err.status == 409) {
                setErrorMessage(err.response?.data?.message);
            }
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
            <TextInput
                style={styles.textInput}
                placeholder="Password..."
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                textContentType="newPassword"
            />
            <TextInput
                style={styles.textInput}
                placeholder="Confirm password..."
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                textContentType="newPassword"
            />
            <Text style={styles.passwordDescription}>Passwords must be 8+ characters, contain at least one uppercase letter, number, and special character (e.g. !, @, $)</Text>
            <TouchableOpacity style={styles.button} onPress={onSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
            <View style={{flexDirection: 'row', marginTop: 5}}>
                <Text>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                    <Text style={{color: 'blue', textDecorationLine: 'underline'}}>Log in here!</Text>
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
        color: 'red',
        marginTop: 5,
        textAlign: 'center'
    },
    passwordDescription: {
        textAlign: 'center',
        marginBottom: 8,
        marginHorizontal: 10
    }
});

export default SignupPage;
