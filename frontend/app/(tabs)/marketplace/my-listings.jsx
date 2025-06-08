import React, { useState, useContext, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import AuthGuard from "@/components/AuthGuard";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import ListingCard from "@/components/ListingCard";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const myListingsPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { userData } = useContext(AuthContext);
    const router = useRouter();

    const getListings = async () => {
        setLoading(true);
        setErrorMessage('');

        try{
            const response = await API.get("/listings/get-my-listings");
            setListings(response.data.listings);
        } catch (error) {
            console.error("Error fetching listings: ", error);
            setErrorMessage("Failed to fetch your listings.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            getListings();
        }, [userData]));

    const handleDelete = useCallback(async (listingId) => {
        Alert.alert(
            "Delete listing",
            "Are you sure you want to delete this listing?",
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await API.delete(`/listings/remove/${listingId}`);
                            await getListings();
                        } catch (error) {
                            console.error("Error deleting listing: ", error);
                            setErrorMessage(error.message);
                            Alert.alert(error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    }, [getListings]);

    return (
        <AuthGuard>
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size='large' color={Colors.greenRegular} />
                </View>
            ) : errorMessage ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorMessage}>Error: {errorMessage}</Text>
                    <TouchableOpacity onPress={getListings} style={styles.retryButton}>
                        <Text color={Colors.greenButton}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listingArea}>
                    <View style={styles.grid}>
                    {listings.length !== 0 ?
                    listings.map((listing) => 
                    <ListingCard key={listing._id} listing={listing} buttonFunction={() => handleDelete(listing._id)} buttonImage={require("@/assets/images/trash-can.png")} />) :
                    <View style={{justifyContent: 'center'}} key={'No Listings'}>
                        <Text style={{fontSize: 30}}>You have no listings.</Text>
                        {userData.timesReported < 3 && <TouchableOpacity onPress={() => router.push('/marketplace/post')}>
                            <Text style={{color: '#14782f', textDecorationLine: 'underline', fontSize: 30}}>{'\n'}Make your first here!</Text>
                        </TouchableOpacity>}
                    </View>
                    }
                    </View>
                </ScrollView>
            )}
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
    listingArea: {
        backgroundColor: Colors.backgroundTan,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
        alignItems: 'flex-start'
    },
    errorMessage: {
        color: 'red',
        fontSize: 20
    },
    centerContainer: {
        alignItems: 'center'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    }
});

export default myListingsPage;