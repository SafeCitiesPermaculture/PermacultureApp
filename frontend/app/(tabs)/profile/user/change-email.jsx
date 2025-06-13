import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";

const ChangeEmailPage = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await API.get("/user/me");
        setEmail(res.data.email || "");
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load current email");
      }
    };
    fetchEmail();
  }, []);

  const handleSubmit = () => {
    setErrorMessage("");

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    Alert.alert(
      "Change Email",
      `Are you sure you want to change your email to:\n${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          style: "destructive",
          onPress: async () => {
            try {
              await API.put("/user/update-profile", { email });
              Alert.alert("Success", "Email updated", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err) {
              console.error(err);
              setErrorMessage(err?.response?.data?.message || "Failed to update email");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Change Email" }} />
      <TextInput
        style={styles.textInput}
        placeholder="New email..."
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Update Email</Text>
      </TouchableOpacity>
      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
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
  errorMessage: {
    fontSize: 16,
    color: "red",
    marginTop: 5,
    textAlign: "center",
  },
});

export default ChangeEmailPage;
