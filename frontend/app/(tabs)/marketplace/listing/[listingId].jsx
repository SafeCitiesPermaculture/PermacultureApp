import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import API from '@/api/api';
import Colors from '@/constants/Colors';
import AuthGuard from "@/components/AuthGuard";
import { AuthContext } from "@/context/AuthContext";
import RemoteImage from '@/components/RemoteImage';
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";

const screenWidth = Dimensions.get('window').width;

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
    
    const deleteListing = async () => {
        try {
            setErrorMessage("Deleting...");
            await API.delete(`/listings/remove/${listingId}`);
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error deleting listing: ", error);
            setErrorMessage(error.response?.data?.message || error.message);
            Alert.alert(errorMessage);
        }
    };

    const handleDelete = useCallback(async () => {
        if(Platform.OS === 'web') {
            deleteListing();
            return;
        }
        Alert.alert(
            "Delete listing",
            "Are you sure you want to delete this listing?",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: deleteListing
                }
            ],
            { cancelable: true }
        );
    }, [listingId, router]);

    const handleSendMessage = async () => {
        try {
            const recipientUsername = listing?.postedBy?.username;

            if (userData.timesReported > 0) {
                Alert.alert("Messaging Disabled", "You have been reported and cannot send messages.");
                return;
            }
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
            setButtonFunction(() => handleDelete);
        } else {
            setButtonFunction(() => reportListing);
        }
    }, [isOwner, isAdmin, handleDelete, reportListing]);
    
    return (
        <AuthGuard>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                {loading ? (
                <ActivityIndicator size="large" color={Colors.greenRegular} />
                ) : errorMessage ? (
                <View style={styles.centered}>
                    <Text style={styles.errorMessageText}>{errorMessage}</Text>
                </View>
                ) : (
                <>
                    <View style={styles.imageWrapper}>
                    <RemoteImage
                        containerStyle={styles.imageContainer}
                        imgSource={{ uri: listing.picture }}
                        imgStyle={styles.displayImage}
                    />
                    </View>

                    <View style={styles.splitRow}>
                    <Text style={styles.title}>{listing.title}</Text>
                    <Text style={styles.price}>R{listing.price}</Text>
                    </View>

                    <View style={styles.splitRow}>
                    <View style={styles.userInfo}>
                        <RemoteImage
                        imgStyle={styles.profilePic}
                        containerStyle={styles.profilePic}
                        imgSource={
                            listing.postedBy.profilePicture !== ""
                            ? { uri: listing.postedBy.profilePicture }
                            : DefaultProfilePicture
                        }
                        />
                        <Text style={styles.username}>{listing.postedBy.username}</Text>
                    </View>
                    <TouchableOpacity onPress={buttonFunction}>
                        <Image style={styles.image} source={imageSource} />
                    </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                    <Image source={require("@/assets/images/location-pin.png")} style={styles.image} />
                    <Text style={styles.location}>{listing.location}</Text>
                    </View>

                    <View style={styles.row}>
                    <TouchableOpacity onPress={handleSendMessage} style={styles.row}>
                        <Image source={require("@/assets/images/send-message.png")} style={styles.image} />
                        <Text style={styles.sendMessage}>Send message</Text>
                    </TouchableOpacity>
                    </View>

                    {listing.description.trim() !== "" && (
                    <>
                        <View style={styles.row}>
                        <Text style={styles.descriptionHeader}>Description</Text>
                        </View>
                        <View style={styles.description}>
                        <Text style={styles.descriptionText}>{listing.description}</Text>
                        </View>
                    </>
                    )}
                </>
                )}
            </ScrollView>
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    paddingBottom: 100
  },
  centered: {
    alignItems: 'center'
  },
  imageWrapper: {
    alignItems: 'center',
    marginVertical: 10
  },
  imageContainer: {
    width: screenWidth - 20,
    height: screenWidth - 20,
    borderRadius: 10,
    overflow: 'hidden'
  },
  displayImage: {
    borderRadius: 10,
    width: '100%',
    height: '100%'
  },
  errorMessageText: {
    color: Colors.errorRed,
    fontSize: 20
  },
  title: {
    fontSize: 40,
    flexShrink: 1
  },
  price: {
    fontSize: 40
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginVertical: 5
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  username: {
    fontSize: 30,
    marginLeft: 3
  },
  profilePic: {
    height: 30,
    width: 30,
    borderRadius: 15
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
    alignItems: 'center',
    marginLeft: 5,
    marginTop: 10
  },
  sendMessage: {
    fontSize: 20,
    marginLeft: 5
  },
  descriptionHeader: {
    fontWeight: 'bold',
    fontSize: 25
  },
  descriptionText: {
    fontSize: 20,
    marginLeft: 5
  },
  description: {
    marginVertical: 10,
    paddingHorizontal: 10
  }
});

export default ListingPage;