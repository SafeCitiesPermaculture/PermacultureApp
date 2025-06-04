import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import API from "@/api/api";
import { useLoading } from "@/context/LoadingContext";

const UserPage = () => {
    const { userId } = useLocalSearchParams();
    const { showLoading, hideLoading } = useLoading();

    const [user, setUser] = useState(null);

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

    useEffect(() => {
        getUser();
    }, []);

    if (!user) return <View></View>;

    return (
        <View>
            <Text>{user.username}</Text>
        </View>
    );
};

export default UserPage;
