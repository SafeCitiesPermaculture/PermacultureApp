import AdminGuard from "@/components/AdminGuard";
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    StyleSheet,
    ScrollView,
} from "react-native";
import searchGlass from "@/assets/images/maginfying glass icon.png";
import Colors from "@/constants/Colors";
import ManageUserCard from "@/components/ManageUserCard";
import API from "@/api/api";
import { useLoading } from "@/context/LoadingContext";

const ManageUsersPage = () => {
    const [searchText, setSearchText] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const { showLoading, hideLoading } = useLoading();

    //populate users list
    const getUsers = async () => {
        try {
            showLoading();
            const res = await API.get("/admin/verified");
            setUsers(res.data);
        } catch (err) {
            console.log("Error when getting users:", err);
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        getUsers();
    }, []);

    //filter user list based on search bar
    useEffect(() => {
        const filtered = users.filter((user) =>
            user.username
                .toLowerCase()
                .includes(searchText.toLowerCase().trim())
        );
        setFilteredUsers(filtered);
    }, [searchText, users]);

    return (
        <AdminGuard>
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <TextInput
                            style={styles.textInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search users..."
                            placeholderTextColor="#888"
                        />
                        {/* magnfiying image*/}
                        <Image source={searchGlass} style={styles.searchIcon} />
                    </View>
                </View>
                <ScrollView style={styles.userContainer}>
                    {filteredUsers.map((item) => (
                        <ManageUserCard key={item._id} user={item} />
                    ))}
                </ScrollView>
            </View>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundTan,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 10,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.greyTextBox,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        flex: 1, // take remaining space
        justifyContent: "space-between",
    },

    searchIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
        marginLeft: 8,
    },
    textInput: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 8,
        fontSize: 16,
    },
    userContainer: {
        backgroundColor: Colors.brownLight,
        flex: 1,
        width: "90%",
        marginBottom: 100,
        marginTop: 20,
        paddingTop: 20,
    },
});

export default ManageUsersPage;
