import React, { useState, useCallback, useContext} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
} from "react-native";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import ListingCard from "@/components/ListingCard";
import API from "@/api/api";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "@/context/AuthContext";
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";

const { width } = Dimensions.get('window');

const MarketplacePage = () => {
    const router = useRouter();

    const chatButton = require("@/assets/images/chat-button.png");
    const postButton = require("@/assets/images/post-button.png");

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const { userData } = useContext(AuthContext);

    const getListings = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const response = await API.get('/listings/get');
            setListings(response.data.listings);
        } catch (error) {
            console.error("Error fetching listings: ", error);
            setErrorMessage("Failed to fetch listings. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            getListings();
        }, [getListings])
    );

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
                        setDeletingId(listingId);
                        try {
                            await API.delete(`/listings/remove/${listingId}`);
                            await getListings();
                        } catch (error) {
                            console.error("Error deleting listing: ", error);
                            setErrorMessage(error.message);
                            Alert.alert(error.message);
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    }, [getListings]);

    const handleReport = (postedBy) => {
        router.push({
            pathname: '/marketplace/report',
            params: {
                reportedUsername: postedBy.username,
                reported: postedBy._id
            }
        });
    };
    
    return (
        <AuthGuard>
            <View style={styles.header}>
                <View style={{ flex: 1 , justifyContent: 'center', alignItems: 'flex-start'}} >
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
                    <ActivityIndicator
                        size="large"
                        color={Colors.greenRegular}
                    />
                </View>
            ) : errorMessage ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorMessage}>Error: {errorMessage}</Text>
                    <TouchableOpacity onPress={getListings} style={styles.retryButton}>
                        <Text style={{color: 'white'}}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : listings.length === 0 ?
                <Text style={{fontSize: 24, color: '#14782f', textAlign: 'center'}}>
                    No listings yet. Make the first one!
                </Text> :
            (
                <ScrollView contentContainerStyle={styles.listingArea}>
                    <View style={styles.grid}>
                    {
                    listings.map((listing) => {
                        if (listing._id.toString() === deletingId?.toString()) {
                            return (
                                <View style={styles.deletingListingBackground}>
                                    <ActivityIndicator size='large' color='red' />
                                </View>
                            )
                        }
                        const isOwnerAdmin = listing.postedBy.username === userData.username || userData.userRole === 'admin'; // If user is owner or admin
                        const buttonImage = isOwnerAdmin ? require("@/assets/images/trash-can.png") : require("@/assets/images/report-flag.png");
                        const buttonFunction = isOwnerAdmin ? () => handleDelete(listing._id) : () => handleReport(listing.postedBy);
                        return (<ListingCard title={listing.title} price={listing.price} postedBy={listing.postedBy} listingId={listing._id} key={listing._id} buttonFunction={buttonFunction} buttonImage={buttonImage}
                            pfpSource={
                                listing.postedBy.profilePicture !== "" ?
                                { uri: listing.postedBy.profilePicture} :
                                DefaultProfilePicture
                            } />);
                    })
                    }
                    </View>
                </ScrollView>
            )}

            {userData.timesReported < 3 && <TouchableOpacity
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
        bottom: 100,
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
        alignItems: "flex-start",
    },
    errorMessage: {
        color: "red",
        fontSize: 20,
    },
    centerContainer: {
        alignItems: "center",
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    retryButton: {
        padding: 10,
        backgroundColor: Colors.greenButton
    },
    deletingListingBackground: {
        backgroundColor: Colors.brownLight,
        padding: 5,
        margin: 10,
        flexShrink: 1,
        width: width / 3 + 25,
        height: 'auto',
        minHeight: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default MarketplacePage;
