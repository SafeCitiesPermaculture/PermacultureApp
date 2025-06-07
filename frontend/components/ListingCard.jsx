import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
} from "react-native";
import Colors from "@/constants/Colors";
import { useRouter } from 'expo-router';
import RemoteImage from "@/components/RemoteImage";
import React, { useState } from 'react';

const { width } = Dimensions.get("window");

const ListingCard = ({ title, price, postedBy, listingId, buttonFunction, buttonImage, pfpSource }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    return (
        <TouchableOpacity
            onPress={() => router.push(`/marketplace/listing/${listingId}`)}
        >
            <View style={styles.background}>
                <View style={styles.topRow}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                    <Text style={styles.price}>R{price}</Text>
                </View>
                <View style={styles.bottomRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <RemoteImage containerStyle={{height: 20, width: 20, marginRight: 3}} imgStyle={styles.profilePic} imgSource={pfpSource} />
                        <Text style={styles.username}>{postedBy.username}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={buttonFunction}
                        style={{justifyContent: 'center'}}
                    >
                        <Image
                            source={buttonImage}
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
        flex: -1,
        fontSize: 12,
    },
    profilePic: {
        height: 20,
        width: 20,
        borderRadius: 10
    }
});

export default ListingCard;
