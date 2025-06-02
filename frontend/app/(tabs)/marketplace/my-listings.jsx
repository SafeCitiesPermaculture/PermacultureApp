import React, { useState, useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import AuthGuard from "@/components/AuthGuard";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import MyListingCard from "@/components/MyListingCard";
import { AuthContext } from "@/context/AuthContext";

const myListingsPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { userData } = useContext(AuthContext);

    const getListings = async () => {
        setLoading(true);
        setErrorMessage('');

        try{
            const response = await API.get("/listings/get-my-listings");
            setListings(response.data.listings || response.data);
        } catch (error) {
            console.error("Error fetching listings: ", error);
            setErrorMessage("Failed to fetch your listings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getListings();
    }, [userData]);

    const handleDelete = async (listingId) => {
        try {
            console.log('removing listing');
            await API.delete(`/listings/remove/${listingId}`);
            console.log('getting again');
            await getListings();
        } catch (error) {
            console.error("Error deleting listing: ", error);
            setErrorMessage(error.message);
        }

    };

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
                    <MyListingCard title={listing.title} price={listing.price} postedBy={userData.username} listingId={listing._id} key={listing._id} onDelete={() => handleDelete(listing._id)} />):
                    <Text>You have no listings. Make your first!</Text>
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