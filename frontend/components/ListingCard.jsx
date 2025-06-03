import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
} from "react-native";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from "@/context/AuthContext";
import API from "@/api/api";

const { width } = Dimensions.get("window");

const ListingCard = ({ title, price, postedBy, listingId }) => {
    const router = useRouter();
    const { userData } = useContext(AuthContext);
    const isOwnerAdmin = postedBy.username === userData.username || userData.userRole === 'admin'; // If user is owner or admin
    const imageSource = isOwnerAdmin ? require("@/assets/images/trash-can.png") : require("@/assets/images/report-flag.png");
    const [buttonFunction, setButtonFunction] = useState(null);
    
    const deleteListing = useCallback(async () => {
        try {
            await API.delete(`/listings/remove/${listingId}`);
        } catch (error) {
            console.error("Error deleting listing:", error);
        }
    }, [listingId, router]);

    const reportListing = useCallback(() => {
            router.push(`/marketplace/report/${postedBy.username}`);
        }, [router]);
     
    useEffect(() => {
            if (isOwnerAdmin) {
                setButtonFunction(() => deleteListing);
            } else {
                setButtonFunction(() => reportListing);
            }
        }, [isOwnerAdmin, deleteListing, reportListing]);

    return (
        <TouchableOpacity
            onPress={() => router.push(`/marketplace/listing/${listingId}`)}
        >
            <View style={styles.background}>
                <View style={styles.topRow}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.price}>R{price}</Text>
                </View>
                <View style={styles.bottomRow}>
                    <Text style={styles.username}>{postedBy.username}</Text>
                    <TouchableOpacity
                        onPress={buttonFunction}
                    >
                        <Image
                            source={imageSource}
                            style={{
                                height: 15,
                                width: 15,
                            }}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    background: {
        backgroundColor: Colors.brownLight,
        padding: 5,
        margin: 10,
        flexShrink: 1,
        width: width / 3 + 25,
        height: 'auto',
        minHeight: 100
    },
    title: {
        flex: -1,
        fontSize: 20,
        textAlignVertical: "center",
    },
    topRow: {
        flex: 2,
        justifyContent: "space-between",
        flexDirection: "row",
        padding: 5,
    },
    price: {
        flex: 1,
        fontSize: 14,
        textAlignVertical: "center",
        textAlign: "right",
    },
    bottomRow: {
        flex: 1,
        justifyContent: "space-between",
        flexDirection: "row",
        padding: 5,
    },
    username: {
        fontSize: 12,
    },
});

export default ListingCard;
