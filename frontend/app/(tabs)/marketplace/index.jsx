import React, { useState, useCallback, useContext} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import ListingCard from "@/components/ListingCard";
import API from "@/api/api";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "@/context/AuthContext";

const MarketplacePage = () => {
    const router = useRouter();

    const chatButton = require("@/assets/images/chat-button.png");
    const postButton = require("@/assets/images/post-button.png");

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const { userData } = useContext(AuthContext);

    const getListings = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const response = await API.get('/listings/get');
            setListings(response.data.listings || response.data);
        } catch (error) {
            console.error("Error fetching listings: ", error);
            setErrorMessage('Failed to fetch listings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            getListings();
        }, [getListings])
    );
    
    return (
        <AuthGuard>
            <View style={styles.header}>
                <View style={{ flex: 1 , justifyContent: 'center', alignItems: 'center'}} >
                    <TouchableOpacity onPress={() => router.push('/marketplace/my-listings')}>
                        <Text style={{fontSize: 14, textAlignVertical: 'center'}}>My listings</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>All Listings</Text>
                </View>
                <View style={styles.chatContainer}>
                    <TouchableOpacity
                        onPress={() => router.push("/marketplace/messages")}
                    >
                        <Image
                            source={chatButton}
                            style={{ height: 35, width: 35 }}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size='large' color={Colors.greenRegular} />
                </View>
            ) : errorMessage ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorMessage}>Error: {errorMessage}</Text>
                    <TouchableOpacity onPress={getListings} style={styles.retryButton}>
                        <Text>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listingArea}>
                    <View style={styles.grid}>
                    {
                    listings.map((listing) => 
                    <ListingCard title={listing.title} price={listing.price} postedBy={listing.postedBy} listingId={listing._id} key={listing._id} />)
                    }
                    </View>
                </ScrollView>
            )}

            {!userData.isReported && <TouchableOpacity
                onPress={() => router.push("/marketplace/post")}
                style={styles.postButton}
            >
                <Image source={postButton} style={{ height: 50, width: 50 }} />
            </TouchableOpacity>}
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: -1,
        flexDirection: "row",
        paddingTop: 5,
        paddingBottom: 20,
        backgroundColor: Colors.backgroundTan,
    },
    titleContainer: {
        flex: 2,
        justifyContent: "center",
        flexDirection: "row",
        backgroundColor: Colors.backgroundTan,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
    },
    chatContainer: {
        flex: 1,
        justifyContent: "flex-end",
        flexDirection: "row",
    },
    chatButton: {
        paddingTop: 5,
        paddingRight: 5,
    },
    postButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "transparent",
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
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
        justifyContent: 'space-between',
    }
});

export default MarketplacePage;
