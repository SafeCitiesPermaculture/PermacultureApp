// Main page for Safe Cities admin
import React, {  createContext, useContext, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import safeCitiesLogo from "@/assets/images/logo.png";
import { useRouter, usePathname } from "expo-router";
import Colors from "@/constants/Colors";
import { AuthContext } from "@/context/AuthContext";


const { width } = Dimensions.get("window");

export default function SchedulePage() {
        const { userData, loading, } = useContext(AuthContext); // Use userData, not user
        const router = useRouter();
        const pathname = usePathname();
        const [hasRedirected, setHasRedirected] = useState(false);
        const {user} = useContext(AuthContext);

        useEffect(() => {
            if (!loading && userData && !hasRedirected) {
                setHasRedirected(true);

                if (userData.isSafeCities && userData.userRole !== "admin") {

                    router.replace("/schedule/WorkersSchedule");
                } else if (!userData.isSafeCities) {

                    router.replace("/schedule/PersonalSchedule");
                }
                // If user is admin, stay on this page (no redirect needed)
            }
        }, [userData, loading, hasRedirected]);

        // Show loading while checking auth or if user needs to be redirected
      if (
        loading ||
        !userData ||
        (userData && userData.isSafeCities && userData.userRole !== "admin")
      ) {
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.greenButton} />
          </View>
        );
      }


  const buttons = [
    {
      label: "Schedule Workers",
      onPress: () => {
        if (pathname !== "/schedule/ScheduleWorkers") {
          router.push("/schedule/ScheduleWorkers");
        }
      },
    },
    {
    label: "View Daily Reports",
      onPress: () => {
        if (pathname !== "/schedule/DailyReport") {
          router.push("/schedule/DailyReport");
        }
      },
    },
    {
      label: "Create Personal Schedule",
      onPress: () => {
        if (pathname !== "/schedule/PersonalSchedule") {
          router.push("/schedule/PersonalSchedule");
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.adminView}>
      <ScrollView style={styles.adminView}>
        <Image source={safeCitiesLogo} style={styles.logo} />




        {buttons.map((btn, index) => (
          <TouchableOpacity key={index} style={styles.button} onPress={btn.onPress}>
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  adminView: {
    flex: 1,
    backgroundColor: Colors.backgroundTan,
  },
  logo: {
    width: width * 0.9,
    height: width * 0.5,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 16,
  },
  button: {
    backgroundColor: Colors.greenButton,
    padding: 25,
    marginVertical: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",

  },
});
