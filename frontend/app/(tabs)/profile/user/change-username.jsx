import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import DeleteModal from "@/components/DeleteModal";

const ChangeUsernamePage = () => {
  const [originalUsername, setOriginalUsername] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  // Load current username on mount
  useEffect(() => {
    const fetchUsername = async () => {
      showLoading();
      try {
        const res = await API.get("/user/me");
        setUsername(res.data.username || "");
        setOriginalUsername(res.data.username || "");
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load current username");
      } finally {
        hideLoading();
      }
    };
    fetchUsername();
  }, []);

  const changeUsername = async () => {
    setLoading(true);
    showLoading();
    setErrorMessage("");
    try {
      await API.put("/user/update-profile", { username });
      setErrorMessage("Username updated!");
      setOriginalUsername(username);
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || "Failed to update username");
    } finally {
      setLoading(false);
      hideLoading();
      setConfirmModalVisible(false);
    }
  };

  const handleSubmit = () => {
    setUsername(username.trim());
    if (!username) {
      setErrorMessage("Username cannot be empty");
      return;
    }
    
    if (username.length < 5) {
      setErrorMessage("Username must be at least 5 characters long.");
      return;
    }

    if (username === originalUsername) {
      setErrorMessage("New username must be different from old username.");

    setConfirmModalVisible(true);
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
      {loading && <ActivityIndicator size="large" color={Colors.greenRegular} />}
      <DeleteModal
        isVisible={confirmModalVisible}
        title="Change Username"
        message="Are you sure you want to change your username?"
        onConfirm={() => changeUsername()}
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
