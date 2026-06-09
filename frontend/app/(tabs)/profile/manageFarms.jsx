// Admin-only screen to manage the list of farms users can belong to.
import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import API from "@/api/api";
import AdminGuard from "@/components/AdminGuard";
import DeleteModal from "@/components/DeleteModal";

const ManageFarmsPage = () => {
    const [farms, setFarms] = useState([]);
    const [newFarmName, setNewFarmName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    const getFarms = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const res = await API.get("/farms", { params: { all: "true" } });
            setFarms(res.data.farms || []);
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            getFarms();
        }, [getFarms])
    );

    const createFarm = async () => {
        if (!newFarmName.trim()) {
            setErrorMessage("Farm name cannot be empty.");
            return;
        }
        setErrorMessage("");
        try {
            await API.post("/farms", { name: newFarmName.trim() });
            setNewFarmName("");
            getFarms();
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error.message);
        }
    };

    const saveRename = async (farmId) => {
        if (!editingName.trim()) return;
        try {
            await API.put(`/farms/${farmId}`, { name: editingName.trim() });
            setEditingId(null);
            setEditingName("");
            getFarms();
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error.message);
        }
    };

    const toggleActive = async (farm) => {
        try {
            await API.put(`/farms/${farm._id}`, { isActive: !farm.isActive });
            getFarms();
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error.message);
        }
    };

    const deleteFarm = async () => {
        try {
            await API.delete(`/farms/${toDeleteId}`);
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error.message);
        } finally {
            setDeleteModalVisible(false);
            setToDeleteId(null);
            getFarms();
        }
    };

    return (
        <AdminGuard>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.header}>Manage Farms</Text>

                    {/* Add a new farm */}
                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.addInput}
                            placeholder="New farm name..."
                            value={newFarmName}
                            onChangeText={setNewFarmName}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={createFarm}>
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}

                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.greenRegular} />
                    ) : farms.length === 0 ? (
                        <Text style={styles.message}>No farms yet. Add one above.</Text>
                    ) : (
                        farms.map((farm) => (
                            <View key={farm._id} style={styles.card}>
                                {editingId === farm._id ? (
                                    <View style={styles.editRow}>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editingName}
                                            onChangeText={setEditingName}
                                            autoFocus
                                        />
                                        <TouchableOpacity
                                            style={styles.smallButton}
                                            onPress={() => saveRename(farm._id)}
                                        >
                                            <Text style={styles.smallButtonText}>Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.smallButton, styles.cancelButton]}
                                            onPress={() => {
                                                setEditingId(null);
                                                setEditingName("");
                                            }}
                                        >
                                            <Text style={styles.smallButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.cardTopRow}>
                                        <Text
                                            style={[
                                                styles.farmName,
                                                !farm.isActive && styles.inactiveName,
                                            ]}
                                        >
                                            {farm.name}
                                            {!farm.isActive ? " (inactive)" : ""}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingId(farm._id);
                                                setEditingName(farm.name);
                                            }}
                                        >
                                            <Text style={styles.renameText}>Rename</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={styles.controlsRow}>
                                    <View style={styles.activeToggle}>
                                        <Text style={styles.activeLabel}>Active</Text>
                                        <Switch
                                            value={farm.isActive}
                                            onValueChange={() => toggleActive(farm)}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => {
                                            setToDeleteId(farm._id);
                                            setDeleteModalVisible(true);
                                        }}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                <DeleteModal
                    isVisible={deleteModalVisible}
                    title="Delete Farm"
                    message="Delete this farm? Users assigned to it will be unassigned."
                    onConfirm={deleteFarm}
                    onCancel={() => {
                        setDeleteModalVisible(false);
                        setToDeleteId(null);
                    }}
                    isLoading={false}
                />
            </SafeAreaView>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContent: { padding: 15, flexGrow: 1 },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.darkGray,
        marginBottom: 15,
        textAlign: "center",
    },
    addRow: {
        flexDirection: "row",
        marginBottom: 15,
        alignItems: "center",
    },
    addInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: "#fff",
        marginRight: 8,
    },
    addButton: {
        backgroundColor: Colors.greenButton,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    addButtonText: { fontSize: 16, fontWeight: "bold" },
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        padding: 12,
        marginBottom: 12,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    farmName: { fontSize: 18, fontWeight: "bold", flex: 1 },
    inactiveName: { color: Colors.gray, fontStyle: "italic" },
    renameText: { color: Colors.greenButton, fontWeight: "bold" },
    editRow: { flexDirection: "row", alignItems: "center" },
    editInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        borderRadius: 8,
        padding: 8,
        fontSize: 16,
        marginRight: 6,
        backgroundColor: "#fff",
    },
    smallButton: {
        backgroundColor: Colors.greenButton,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginLeft: 4,
    },
    cancelButton: { backgroundColor: "#ffbaba" },
    smallButtonText: { fontWeight: "bold", fontSize: 13 },
    controlsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    activeToggle: { flexDirection: "row", alignItems: "center" },
    activeLabel: { marginRight: 6, fontSize: 15 },
    deleteButton: {
        backgroundColor: Colors.errorRed,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
    },
    deleteButtonText: { color: "#fff", fontWeight: "bold" },
    message: {
        fontSize: 16,
        textAlign: "center",
        color: Colors.gray,
        marginTop: 20,
    },
    errorText: {
        fontSize: 14,
        color: "red",
        textAlign: "center",
        marginBottom: 10,
    },
});

export default ManageFarmsPage;
