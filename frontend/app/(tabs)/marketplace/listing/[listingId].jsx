import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import API from '@/api/api';
import Colors from '@/constants/Colors';
import AuthGuard from "@/components/AuthGuard";
import { AuthContext } from "@/context/AuthContext";


const ListingPage = () => {
    const { listingId } = useLocalSearchParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [buttonFunction, setButtonFunction] = useState(null);
    const { userData } = useContext(AuthContext);
    const router = useRouter();

    const getListingDetails = useCallback(async () => {
        if (!listingId) {
            setErrorMessage('Listing ID is missing.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await API.get(`/listings/get/${listingId}`);
            const tempListing = response.data.listing;
            setListing(tempListing);
            if (tempListing && userData) {
                setIsOwner(tempListing.postedBy._id.toString() === userData._id.toString());
            }
        } catch (error) {
            console.error("Error fetching listing details:", error);
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    }, [listingId, userData]);

    useEffect(() => {
        getListingDetails();
    }, [getListingDetails]);
    
    const deleteListing = useCallback(async () => {
        Alert.alert(
            "Delete listing",
            "Are you sure you want to delete this listing?",
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setErrorMessage("Deleting...");
                            await API.delete(`/listings/remove/${listingId}`);
                            setTimeout(() => router.dismiss(), 1000);
                        } catch (error) {
                            console.error("Error deleting listing: ", error);
                            setErrorMessage(error.message);
                            Alert.alert(error.message);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    }, [listingId, router]);

    const handleSendMessage = async () => {
        try {
            const recipientUsername = listing?.postedBy?.username;
            if (!recipientUsername || recipientUsername === userData?.username) {
                alert("Cannot message yourself.");
                return;
            }

            const response = await API.post('/conversations', {
                usernames: [recipientUsername]
            });

            const conversationId = response.data._id;
            router.push(`/marketplace/${conversationId}`);
        } catch (error) {
            console.error("Failed to initiate conversation:", error);
            setErrorMessage("Failed to send message.");
        }
    };

    const reportListing = useCallback(() => {
        router.push({
            pathname: '/marketplace/report',
            params: {
                reportedUsername: listing?.postedBy.username,
                reported: listing?.postedBy._id
            }});
    }, [router, listing]);

    const isAdmin = userData.userRole === 'admin';
    const imageSource = isOwner || isAdmin ? require("@/assets/images/trash-can.png") : require("@/assets/images/report-flag.png");

    useEffect(() => {
        if (isOwner || isAdmin) {
            setButtonFunction(() => deleteListing);
        } else {
            setButtonFunction(() => reportListing);
        }
    }, [isOwner, isAdmin, deleteListing, reportListing]);
    
    
    return (
        <AuthGuard>
            <ScrollView>
                {loading ? <ActivityIndicator size="large" color={Colors.greenRegular} /> :
                errorMessage ? (
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.errorMessageText}>{errorMessage}</Text>
                </View>) : 
                <>
                <View style={styles.splitRow}>
                        <Text style={styles.title}>{listing.title}</Text>
                        <Text style={styles.price}>R{listing.price}</Text>
                </View>
                <View style={styles.splitRow}>
                    <Text style={styles.username}>{listing.postedBy.username}</Text>
                    <TouchableOpacity onPress={buttonFunction}>
                        <Image style={styles.image} source={imageSource}/>
                    </TouchableOpacity>
                </View>
                <View style={styles.row}>
                    <Image source={require("@/assets/images/location-pin.png")} style={styles.image} />
                    <Text style={styles.location}>{listing.location}</Text>
                </View>
                <View style={styles.row}>
                    <TouchableOpacity onPress={handleSendMessage} style={{flexDirection: 'row'}}>
                        <Image source={require("@/assets/images/send-message.png")} style={styles.image} />
                        <Text style={styles.sendMessage}>Send message</Text>
                    </TouchableOpacity>
                </View>
                
                {listing.description.trim() !== "" ? 
                (<>
                    <View style={styles.row}>
                        <Text style={styles.descriptionHeader}>Description</Text>
                    </View>
                    <View style={styles.description}>
                        <Text style={styles.descriptionText}>{listing.description}</Text>
                    </View>
                </>) : null}
                
                </>
                }
            </ScrollView>
        </AuthGuard>
    );
};



const styles = StyleSheet.create({
    errorMessageText: {
        color: Colors.errorRed,
        fontSize: 20
    },
    title: {
        fontSize: 40,
        flex: -1
    },
    price: {
        fontSize: 40
    },
    splitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 10,
        marginVertical: 5,
    },
    username: {
        fontSize: 30
    },
    image: {
        width: 30,
        height: 30
    },
    location: {
        fontSize: 25
    },
    row: {
        flexDirection: 'row',
        marginLeft: 5,
        marginTop: 10
    },
    sendMessage: {
        fontSize: 20
    },
    descriptionHeader: {
        fontWeight: 'bold',
        fontSize: 25
    },
    descriptionText: {
        fontSize: 20,
        marginLeft: 5
    }
});

export default ListingPage;