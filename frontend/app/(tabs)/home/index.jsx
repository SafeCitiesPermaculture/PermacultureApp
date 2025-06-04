//home screen page
import { useRouter, usePathname } from "expo-router";
import React from "react";
import {
    View,
    Image,
    ScrollView,
    Dimensions,
    Text,
    Button,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import safeCitiesLogo from "@/assets/images/logo.png";
import Menu from "@/components/Menu";
import Colors from "@/constants/Colors.js";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const router = useRouter();
    const pathname = usePathname(); // <-- current path
    const buttons = [
        {
            label: "Marketplace",
            icon: require("@/assets/images/marketplace icon.png"),
            onPress: () => {
                if (pathname !== "/marketplace") {
                    router.push("/marketplace");
                }
            },
        },
        {
            label: "Information Page",
            icon: require("@/assets/images/Info icon.png"),
            onPress: () => {
                if (pathname !== "/information") {
                    router.push("/information");
                }
            },
        },
        {
            label: "Schedule",
            icon: require("@/assets/images/schedule icon.png"),
            onPress: () => {
                if (pathname !== "/schedule") {
                    router.push("/schedule");
                }
            },
        },
        {
            label: "Profile Page",
            icon: require("@/assets/images/profile icon.png"),
            onPress: () => {
                if (pathname !== "/profile") {
                    router.push("/profile");
                }
            },
        },
    ];

    return (
        <SafeAreaView style={styles.homescreen}>
            <ScrollView
                style={styles.homescreen}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <Image source={safeCitiesLogo} style={styles.pic} />
                <Text style={texts.header}> WHO WE ARE </Text>
                <Text style={texts.body}>
                    Safe Cities is a Non Profit Organization based in Elsies
                    River. We focus on Social Development and Skills Training,
                    such as Capacity Building & Theatre Training, Construction
                    Skills Training, Perma-Culture Skills Training, Young
                    Leaders Initiative Program, and Wellness & Women Empowerment
                    Program.
                </Text>
                <Text style={texts.header}> VISION & MISSION </Text>
                <Text style={texts.body}>
                    Our vision is to ensure that individuals have the
                    opportunity to be trained and equipped, through our
                    programs. This will better prepare them for an evolving
                    society. We focus on leadership training,
                    self-sustainability and community upliftment. We believe in
                    empowering and educating, youth, women, men and children.
                </Text>
                {buttons.map((btn, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.button}
                        onPress={btn.onPress}
                    >
                        <Image source={btn.icon} style={styles.icon} />
                        <Text style={styles.label}>{btn.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const texts = StyleSheet.create({
    header: {
        fontSize: 25,
        padding: 8,
        fontWeight: "bold",
    },
    body: {
        fontSize: 18,
        padding: 8,
    },
});
const styles = StyleSheet.create({
    homescreen: {
        flex: 1,
        color: Colors.backgroundTan,
    },
    container: {
        flex: 1,
        paddingTop: 40, // or StatusBar.currentHeight if you want to push below system bar
        alignItems: "center", // center image horizontally
    },
    pic: {
        width: width * 0.9, // 90% of screen width
        height: width * 0.3, // makes it a short rectangle
        resizeMode: "contain",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.greenButton,
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        elevation: 2,
    },
    icon: {
        width: 32,
        height: 32,
        marginRight: 16,
        resizeMode: "contain",
    },
    label: {
        fontSize: 20,
        fontWeight: "bold",
        textDecorationLine: "underline",
        color: "#000",
    },
});
