import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import DeleteModal from "@/components/DeleteModal";

const ChangeFarmPage = () => {
  const [originalFarmName, setOriginalFarmName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchFarm = async () => {
      showLoading();
      try {
        const res = await API.get("/user/me");
        setFarmName(res.data.farmName || "");
        setOriginalFarmName(res.data.farmName || "");
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load current farm name");
      } finally {
        hideLoading();
      }
    };
    fetchFarm();
  }, []);

  const changeFarm = async () => {
    showLoading();
    setLoading(true);
    setErrorMessage("");
    try {
      await API.put("/user/update-profile", { farmName });
      setErrorMessage("Farm updated successfully");
      setOriginalFarmName(farmName);
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || "Failed to update farm name");
    } finally {
      setLoading(false);
      hideLoading();
      setConfirmModalVisible(false);
    }
  };


  const handleSubmit = () => {
    if (!farmName.trim()) {
      setErrorMessage("Farm name cannot be empty");
      return;
    }

    if (farmName.trim().toLowerCase() === "safe cities" || farmName.trim().toLowerCase() === "safecities") {
      setErrorMessage("Cannot assign self to safe cities farm. Ask an admin to do so.");
      return;
    }

    if (farmName.trim().toLowerCase() === originalFarmName.trim().toLowerCase()) {
      setErrorMessage("New farm name must be different from old name");
      return;
    }

    if (Platform.OS === "web") {
      changeFarm();
      return;
    }
    
    setConfirmModalVisible(true);
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
      {loading && <ActivityIndicator size="large" color={Colors.greenRegular} />}
      <DeleteModal
        isVisible={confirmModalVisible}
        title="Change Farm"
        message="Are you sure you want to change your farm?"
        onConfirm={() => changeFarm()}
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

export default ChangeFarmPage;
