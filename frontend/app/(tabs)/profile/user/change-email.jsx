import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import DeleteModal from "@/components/DeleteModal";

const ChangeEmailPage = () => {
  const [originalEmail, setOriginalEmail] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchEmail = async () => {
      showLoading();
      try {
        const res = await API.get("/user/me");
        setEmail(res.data.email || "");
        setOriginalEmail(res.data.email || "");
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load current email");
      } finally {
        hideLoading();
      }
    };
    fetchEmail();
  }, []);

  const changeEmail = async () => {
    setErrorMessage("");
    setLoading(true);
    showLoading();
    try {
      await API.put("/user/update-profile", { email });
      setErrorMessage("Email updated!");
      setOriginalEmail(email);
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || err.message || "Failed to update email");
    } finally {
      setLoading(false);
      hideLoading();
      setConfirmModalVisible(false);
    }
  };

  const handleSubmit = () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (email === originalEmail) {
      setErrorMessage("New email must be different from old email");
      return;
    }

    setConfirmModalVisible(true);
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
      {loading && <ActivityIndicator size="large" color={Colors.greenRegular} />}
      <DeleteModal
        isVisible={confirmModalVisible}
        title="Change Email"
        message="Are you sure you want to change your email?"
        onConfirm={() => changeEmail()}
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

export default ChangeEmailPage;
