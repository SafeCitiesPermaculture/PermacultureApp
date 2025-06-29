import React, { useState, useContext, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import AuthGuard from "@/components/AuthGuard";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import ListingCard from "@/components/ListingCard";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import DeleteModal from "@/components/DeleteModal";
import { useLoading } from "@/context/LoadingContext";

const myListingsPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [toBeDeletedId, setToBeDeletedId] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const { userData } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const router = useRouter();

    const getListings = async () => {
        setLoading(true);
        setErrorMessage('');
        showLoading();
        try{
            const response = await API.get("/listings/get-my-listings");
            setListings(response.data.listings);
        } catch (error) {
            console.error("Error fetching listings: ", error);
            setErrorMessage("Failed to fetch your listings.");
        } finally {
            hideLoading();
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            getListings();
        }, [userData]));
    
    const deleteListing = useCallback(async (listingId) => {
        setErrorMessage("");
        setDeletingId(listingId);
        showLoading();
        try {
            await API.delete(`/listings/remove/${listingId}`);
            await getListings();
        } catch (error) {
            console.error("Error deleting listing: ", error);
            setErrorMessage(error.reponse?.data?.message || error.message);
        } finally {
            hideLoading();
            setDeletingId(null);
            setDeleteModalVisible(false);
            setToBeDeletedId(null);
        }
    }, [getListings]);

    const handleDelete = useCallback((listingId) => {
        setDeletingId(null);
        setToBeDeletedId(listingId);
        setDeleteModalVisible(true);
    }, []);

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

            <DeleteModal
                isVisible={deleteModalVisible}
                title="Delete Listing"
                message="Are you sure you want to delete this listing?"
                onConfirm={() => deleteListing(toBeDeletedId)}
                onCancel={() => {
                    setDeletingId(null);
                    setToBeDeletedId(null);
                    setDeleteModalVisible(false);
                }}
                isLoading={!!deletingId}
                />
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