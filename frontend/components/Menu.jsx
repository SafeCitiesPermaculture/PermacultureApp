import React from "react";
import {
    View,
    Text,
    Button,
    StyleSheet,
    Image,
    Pressable,
} from "react-native";
import homeIcon from "@/assets/images/home icon transparent.png";
import infoIcon from "@/assets/images/Info icon.png";
import marketIcon from "@/assets/images/marketplace icon.png";
import chatIcon from "@/assets/images/chat forum icon.png";
import scheduleIcon from "@/assets/images/schedule icon.png";
import profileIcon from "@/assets/images/profile icon.png";


import colors from "@/constants/Colors.js";

const icons = {
   home: require('@/assets/images/home icon transparent.png'),
    info: require('@/assets/images/Info icon.png'),
    market: require('@/assets/images/marketplace icon.png'),
    chat: require('@/assets/images/chat forum icon.png'),
    schedule: require('@/assets/images/schedule icon.png'),
    profile: require('@/assets/images/profile icon.png'),
};

export default function Menu() {
        return <View style={styles.bottomRectangle}>
             {Object.entries(icons).map(([key, icon], index) => (
                   <Pressable key={index} onPress={() => console.log(`Pressed ${key}`)}>
                    <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.image} />

                   </Pressable>
                 ))}
        </View>;
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bottomRectangle: {
        //position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        backgroundColor: colors.menuBrown,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-around', //evenly spaced
        alignItems: 'center',
        paddingHorizontal: 10,
    },
image: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    },
});
