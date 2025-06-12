import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";

const ChangeFarmPage = () => {
  const [farmName, setFarmName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const res = await API.get("/user/me");
        setFarmName(res.data.farmName || "");
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load current farm name");
      }
    };
    fetchFarm();
  }, []);

  const handleSubmit = () => {
    if (!farmName.trim()) {
      setErrorMessage("Farm name cannot be empty");
      return;
    }

    Alert.alert(
      "Change Farm Name",
      `Are you sure you want to change your farm name to "${farmName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          style: "destructive",
          onPress: async () => {
            try {
              await API.put("/users/update-profile", { farmName });
              Alert.alert("Success", "Farm name updated", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err) {
              console.error(err);
              setErrorMessage(err?.response?.data?.message || "Failed to update farm name");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Change Farm Name" }} />
      <TextInput
        style={styles.textInput}
        placeholder="New farm name..."
        value={farmName}
        onChangeText={setFarmName}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Update Farm Name</Text>
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

export default ChangeFarmPage;
