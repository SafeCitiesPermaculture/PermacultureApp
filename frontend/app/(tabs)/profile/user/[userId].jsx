import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    TextInput,
    Alert
} from "react-native";
import API from "@/api/api";
import { useLoading } from "@/context/LoadingContext";
import Colors from "@/constants/Colors";
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";
import RemoteImage from "@/components/RemoteImage";
import DeleteModal from "@/components/DeleteModal";

const UserPage = () => {
    const { userId } = useLocalSearchParams();
    const { showLoading, hideLoading } = useLoading();
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [farms, setFarms] = useState([]);
    const [selectedFarms, setSelectedFarms] = useState([]);
    const [roleSwitch, setRoleSwitch] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    const setRole = (val) => {
        setRoleSwitch(val);
        user.userRole = val ? "admin" : "user";
    };

    // Toggle the user's membership of a farm. A user can belong to several.
    const toggleFarm = (farmId) => {
        setSelectedFarms((prev) => {
            const next = prev.includes(farmId)
                ? prev.filter((id) => id !== farmId)
                : [...prev, farmId];
            user.farms = next;
            return next;
        });
    };

    //retrieves the users data
    const getUser = async () => {
        try {
            showLoading();
            const res = await API.get(`/admin/user/${userId}`);
            setUser(res.data);
        } catch (err) {
            console.log("Error getting user", err);
        } finally {
            hideLoading();
        }
    };

    //retrieves the available farms
    const getFarms = async () => {
        try {
            const res = await API.get("/farms", { params: { all: "true" } });
            setFarms(res.data.farms || []);
        } catch (err) {
            console.log("Error getting farms", err);
        }
    };

    useEffect(() => {
        getUser();
        getFarms();
    }, []);

    useEffect(() => {
        if (!user) return;
        setRoleSwitch(user.userRole === "admin");
        setSelectedFarms((user.farms || []).map((f) => f._id || f));
    }, [user]);

    //soft deletes the user
    const removeUser = async () => {
        try {
            setLoading(true);
            showLoading();
            await API.put(`/admin/remove/${user._id}`);
        } catch (err) {
            console.log("Error deleting user", err);
        } finally {
            hideLoading();
            setLoading(false);
            setDeleteModalVisible(false);
            router.back();
        }
    };

    const handleRemove = () => {
        setDeleteModalVisible(true);
    }

    //updates the user
    const updateUser = async () => {
        try {
            showLoading();
            await API.put(`/admin/user/update/${user._id}`, {
                updatedUserData: user,
            });
        } catch (err) {
            console.log("Error updating user", err);
        } finally {
            hideLoading();
            router.back();
        }
    };

    // Set a new password for this user. Existing passwords are hashed and cannot
    // be viewed, so an admin can only overwrite with a new one.
    const resetPassword = async () => {
        setPasswordMessage("");
        if (newPassword.length < 6) {
            setPasswordMessage("Password must be at least 6 characters.");
            return;
        }
        try {
            showLoading();
            await API.put(`/admin/user/reset-password/${user._id}`, { newPassword });
            setPasswordMessage("Password updated successfully.");
            setNewPassword("");
        } catch (err) {
            setPasswordMessage(
                err?.response?.data?.message || "Failed to update password."
            );
        } finally {
            hideLoading();
        }
    };

    if (!user) return <View></View>;

    return (
        <View style={styles.container}>
            <RemoteImage
                containerStyle={styles.profileImageWrapper}
                imgStyle={styles.profileImage}
                imgSource={
                    user.profilePicture !== ""
                        ? { uri: user.profilePicture }
                        : DefaultProfilePicture
                }
            />
            <Text style={styles.nameText}>{user.username}</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <View style={styles.switchContainer}>
                <View style={styles.switchWrapper}>
                    <Text style={styles.switchText}>Admin:</Text>
                    <Switch value={roleSwitch} onValueChange={setRole} />
                </View>
            </View>

            <Text style={styles.farmLabel}>Farms (select any):</Text>
            <View style={styles.farmsList}>
                {farms.length === 0 ? (
                    <Text style={styles.farmEmptyText}>No farms yet.</Text>
                ) : (
                    farms.map((farm) => {
                        const checked = selectedFarms.includes(farm._id);
                        return (
                            <TouchableOpacity
                                key={farm._id}
                                style={styles.farmRow}
                                onPress={() => toggleFarm(farm._id)}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        checked && styles.checkboxChecked,
                                    ]}
                                >
                                    {checked && <Text style={styles.checkboxTick}>✓</Text>}
                                </View>
                                <Text style={styles.farmRowText}>
                                    {farm.isActive ? farm.name : `${farm.name} (inactive)`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            <View style={styles.passwordSection}>
                <Text style={styles.farmLabel}>Set New Password:</Text>
                <Text style={styles.passwordHint}>
                    Existing passwords are encrypted and cannot be viewed. You can
                    set a new one for the user here.
                </Text>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={styles.passwordButton}
                    onPress={resetPassword}
                >
                    <Text style={styles.passwordButtonText}>Update Password</Text>
                </TouchableOpacity>
                {passwordMessage ? (
                    <Text style={styles.passwordMessage}>{passwordMessage}</Text>
                ) : null}
            </View>

            <TouchableOpacity style={styles.removeButton} onPress={removeUser}>
                <Text style={styles.removeText}>Remove User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={updateUser}>
                <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
            <DeleteModal
                isVisible={deleteModalVisible}
                title="Remove User"
                message="Are you sure you want to remove this user?"
                onConfirm={() => removeUser()}
                onCancel={() => setDeleteModalVisible(false)}
                isLoading={loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: "flex",
        backgroundColor: Colors.backgroundTan,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "end",
    },

    profileImageWrapper: {
        width: 200,
        height: 200,
        marginBottom: 10,
        marginTop: 5,
    },

    profileImage: {
        width: 200,
        height: 200,
        borderWidth: 1,
        borderColor: "rgba(0,0,0, 0.3)",
        borderRadius: 10,
    },

    nameText: {
        fontSize: 30,
        fontWeight: "bold",
        marginBottom: 10,
    },

    emailText: {
        fontSize: 20,
        marginBottom: 10,
    },

    farmText: {
        fontSize: 20,
        marginBottom: 10,
    },

    farmLabel: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },

    farmsList: {
        width: "80%",
        marginBottom: 20,
    },
    farmEmptyText: {
        fontSize: 15,
        color: Colors.darkGray,
        fontStyle: "italic",
    },
    farmRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        borderRadius: 8,
        marginBottom: 6,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: Colors.brownMedium,
        borderRadius: 4,
        marginRight: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: Colors.greenButton,
        borderColor: Colors.greenButton,
    },
    checkboxTick: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    farmRowText: {
        fontSize: 16,
    },

    switchContainer: {
        marginBottom: 20,
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    switchWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.brownLight,
        padding: 10,
        borderRadius: 5,
        margin: 5,
    },

    switchText: {
        marginRight: 5,
        fontSize: 18,
    },

    passwordSection: {
        width: "85%",
        alignItems: "center",
        backgroundColor: Colors.brownLight,
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },

    passwordHint: {
        fontSize: 13,
        color: Colors.darkGray,
        textAlign: "center",
        marginBottom: 8,
    },

    passwordInput: {
        width: "100%",
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        borderRadius: 8,
        padding: 10,
        backgroundColor: "#fff",
        fontSize: 16,
        marginBottom: 8,
    },

    passwordButton: {
        backgroundColor: Colors.greenButton,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },

    passwordButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },

    passwordMessage: {
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
        color: Colors.darkGray,
    },

    removeButton: {
        backgroundColor: Colors.errorRed,
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },

    removeText: {
        fontSize: 20,
        color: "#fff",
    },

    saveButton: {
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 5,
    },

    saveText: {
        fontSize: 20,
    },
});

export default UserPage;
