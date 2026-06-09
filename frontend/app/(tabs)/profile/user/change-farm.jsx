import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, ScrollView } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import DeleteModal from "@/components/DeleteModal";

const ChangeFarmPage = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarms, setSelectedFarms] = useState([]);
  const [originalFarms, setOriginalFarms] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchData = async () => {
      showLoading();
      try {
        const [meRes, farmsRes] = await Promise.all([
          API.get("/user/me"),
          API.get("/farms"),
        ]);
        setFarms(farmsRes.data.farms || []);
        const current = (meRes.data.farms || []).map((f) => f._id || f);
        setSelectedFarms(current);
        setOriginalFarms(current);
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load farm information");
      } finally {
        hideLoading();
      }
    };
    fetchData();
  }, []);

  const toggleFarm = (farmId) => {
    setSelectedFarms((prev) =>
      prev.includes(farmId)
        ? prev.filter((id) => id !== farmId)
        : [...prev, farmId]
    );
  };

  const changeFarm = async () => {
    showLoading();
    setLoading(true);
    setErrorMessage("");
    try {
      await API.put("/user/update-profile", { farms: selectedFarms });
      setErrorMessage("Farms updated successfully");
      setOriginalFarms(selectedFarms);
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || "Failed to update farms");
    } finally {
      setLoading(false);
      hideLoading();
      setConfirmModalVisible(false);
    }
  };

  const sameSelection = () => {
    if (selectedFarms.length !== originalFarms.length) return false;
    return selectedFarms.every((id) => originalFarms.includes(id));
  };

  const handleSubmit = () => {
    if (sameSelection()) {
      setErrorMessage("Please change your farm selection first.");
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
      <Stack.Screen options={{ title: "Change Farm" }} />
      <Text style={styles.label}>Select your farm(s):</Text>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 10 }}>
        {farms.length === 0 ? (
          <Text style={styles.emptyText}>No farms available.</Text>
        ) : (
          farms.map((farm) => {
            const checked = selectedFarms.includes(farm._id);
            return (
              <TouchableOpacity
                key={farm._id}
                style={styles.row}
                onPress={() => toggleFarm(farm._id)}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.tick}>✓</Text>}
                </View>
                <Text style={styles.rowText}>{farm.name}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Update Farms</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
      {loading && <ActivityIndicator size="large" color={Colors.greenRegular} />}
      <DeleteModal
        isVisible={confirmModalVisible}
        title="Change Farms"
        message="Are you sure you want to change your farms?"
        onConfirm={() => changeFarm()}
        onCancel={() => setConfirmModalVisible(false)}
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
        paddingTop: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    list: {
        width: "90%",
        maxHeight: "60%",
    },
    emptyText: {
        fontSize: 15,
        color: Colors.darkGray,
        fontStyle: "italic",
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: Colors.brownMedium,
        borderRadius: 4,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: Colors.greenButton,
        borderColor: Colors.greenButton,
    },
    tick: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    rowText: {
        fontSize: 16,
    },
    button: {
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        marginTop: 15,
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
