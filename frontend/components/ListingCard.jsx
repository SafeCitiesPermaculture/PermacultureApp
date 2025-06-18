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
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";

const { width } = Dimensions.get("window");

const ListingCard = ({ listing, buttonFunction, buttonImage }) => {
    const router = useRouter();

    return (
     
        <TouchableOpacity
            onPress={() => router.push(`/marketplace/listing/${listing._id}`)}
        >
            <View style={styles.background}>
                <RemoteImage
                    containerStyle={styles.imageContainer}
                    imgStyle={styles.listingImage}
                    imgSource={{ uri: listing.picture }}
                />
                <View style={styles.topRow}>
                    <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
                    <Text style={styles.price} numberOfLines={1}>R{listing.price}</Text>
                </View>
                <View style={styles.bottomRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <RemoteImage containerStyle={styles.profilePicContainer} imgStyle={styles.profilePic} 
                        imgSource={listing.postedBy.profilePicture !== "" ?
                            { uri: listing.postedBy.profilePicture } :
                            DefaultProfilePicture
                         } />
                        <Text style={styles.username}>{listing.postedBy.username}</Text>
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
        width: width / 2 - 30,
        borderRadius: 10,
        height: 250,
    },
    imageContainer: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 5,
    },
    listingImage: {
        width: "100%",
        height: "100%",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 5,
        marginBottom: 5,
    },
    title: {
        flex: 1,
        fontSize: 14,
        flexWrap: "wrap",
        marginRight: 5,
        maxWidth: "75%",
    },
    price: {
        fontSize: 14,
        textAlign: "right",
        maxWidth: "25%",

    },
    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 5,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilePicContainer: {
        height: 20,
        width: 20,
        marginRight: 3,
    },
    profilePic: {
        height: 20,
        width: 20,
        borderRadius: 10,
    },
    username: {
        fontSize: 12,
    },
    buttonIcon: {
        height: 15,
        width: 15,
    }
});

export default ListingCard;
