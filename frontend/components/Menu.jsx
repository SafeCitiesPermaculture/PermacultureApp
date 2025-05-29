import React from "react";
import {
    View,
    ScrollView,
    Text,
    Button,
    StyleSheet,
    SafeAreaView,
} from "react-native";

// import homeIcon from "@/assets/images/home icon transparent.png";
// import infoIcon from "@/assets/images/info icon.png";
// import marketIcon from "@/assets/images/marketplace icon.png";
// import chatIcon from "@/assets/images/chat forum icon.png";
// import scheduleIcon from "@/assets/images/schedule icon.png";
// import profileIcon from "@/assets/images/profile icon.png";

import colors from "@/constants/Colors.js";
import { TouchableOpacity } from 'react-native';


// const icons = {
//     home: homeIcon,
//     info: infoIcon,
//     market: marketIcon,
//     chat: chatIcon,
//     schedule: scheduleIcon,
//     profile: profileIcon,
// };

export default function Menu() {
    return <View style={styles.bottomRectangle}>
{/*         <Image source={require(home)} style={styles.image} /> */}
{/*         <Image source={require(info)} style={styles.image} /> */}
{/*         <Image source={require(market)} style={styles.image} /> */}
{/*         <Image source={require(chat)} style={styles.image} /> */}
{/*         <Image source={require(schedule)} style={styles.image} /> */}
{/*         <Image source={require(profile)} style={styles.image} /> */}

    </View>;
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bottomRectangle: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        backgroundColor: colors.menuBrown,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
});
