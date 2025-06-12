import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";

const ChangeUsernamePage = () => {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Load current username on mount
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const res = await API.get("/user/me");
        setUsername(res.data.username || "");
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load current username");
      }
    };
    fetchUsername();
  }, []);

  const handleSubmit = () => {
    if (!username.trim()) {
      setErrorMessage("Username cannot be empty");
      return;
    }

    Alert.alert(
      "Change Username",
      `Are you sure you want to change your username to "${username}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          style: "destructive",
          onPress: async () => {
            try {
              await API.put("/users/update-profile", { username });
              Alert.alert("Success", "Username updated", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err) {
              console.error(err);
              setErrorMessage(err?.response?.data?.message || "Failed to update username");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Change Username" }} />
      <TextInput
        style={styles.textInput}
        placeholder="New username..."
        value={username}
        onChangeText={setUsername}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Update Username</Text>
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

export default ChangeUsernamePage;
