import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Image,
} from "react-native";
import API from "@/api/api";
import { useLoading } from "@/context/LoadingContext";
import Colors from "@/constants/Colors";
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";
import RemoteImage from "@/components/RemoteImage";

const UserPage = () => {
    const { userId } = useLocalSearchParams();
    const { showLoading, hideLoading } = useLoading();
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [originalFarmName, setOriginalFarmName] = useState(null);
    const [roleSwitch, setRoleSwitch] = useState(false);
    const [safeCitiesSwitch, setSafeCitiesSwitch] = useState(false);

    const setRole = (val) => {
        setRoleSwitch(val);
        user.userRole = val ? "admin" : "user";
    };

    const setSafeCities = (val) => {
        setSafeCitiesSwitch(val);
        user.isSafeCities = val;
        user.farmName = val ? "Safe Cities" : originalFarmName;
    };

    //retrieves the users data
    const getUser = async () => {
        try {
            showLoading();
            const res = await API.get(`/admin/user/${userId}`);
            setUser(res.data);
            if (originalFarmName === null)
                if (res.data.farmName === "Safe Cities") {
                    setOriginalFarmName("");
                } else {
                    setOriginalFarmName(res.data.farmName);
                }
        } catch (err) {
            console.log("Error getting user", err);
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        if (!user) return;
        setRoleSwitch(user.userRole === "admin");
        setSafeCitiesSwitch(user.isSafeCities);
    }, [user]);

    //soft deletes the user
    const removeUser = async () => {
        try {
            showLoading();
            await API.put(`/admin/remove/${user._id}`);
        } catch (err) {
            console.log("Error deleting user", err);
        } finally {
            hideLoading();
            router.back();
        }
    };

    //updates the user
    const updateUser = async () => {
        try {
            showLoading();
            await API.put(`/admin/user/update/${user._id}`, {
                updatedUserData: user,
            });
        } catch (err) {
            console.log("Error updating user", er);
        } finally {
            hideLoading();
            router.back();
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
            <Text style={styles.farmText}>
                {user.farmName.length > 0 ? user.farmName : "No Farm"}
            </Text>
            <View style={styles.switchContainer}>
                <View style={styles.switchWrapper}>
                    <Text style={styles.switchText}>Admin:</Text>
                    <Switch value={roleSwitch} onValueChange={setRole} />
                </View>
                <View style={styles.switchWrapper}>
                    <Text style={styles.switchText}>Safe Cities:</Text>
                    <Switch
                        value={safeCitiesSwitch}
                        onValueChange={setSafeCities}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.removeButton} onPress={removeUser}>
                <Text style={styles.removeText}>Remove User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={updateUser}>
                <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
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
