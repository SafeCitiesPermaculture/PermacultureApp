import React, { createContext, useContext, useEffect, useState,  useLayoutEffect  } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  Button,
} from "react-native";
import safeCitiesLogo from "@/assets/images/logo.png";
import { useRouter, usePathname,useNavigation } from "expo-router";
import Colors from "@/constants/Colors";
import addIcon from "@/assets/images/Add _ plus icon.png";
import { Picker } from '@react-native-picker/picker';
import API from "@/api/api";
import PersonalScheduleComponent from "@/components/PersonalScheduleComponent";
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from "@/context/AuthContext";

const { width } = Dimensions.get("window");


export default function WorkersPage() {
  const [schedules, setSchedules] = useState([]);
  const {user} = useContext(AuthContext);
  const { userData, loading, } = useContext(AuthContext);
 const navigation = useNavigation();

        useLayoutEffect(() => {
            if (userData.userRole !== "admin"){
            navigation.setOptions({
                headerShown: false,
            });
        }
        }, [navigation]);
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await API.get("/ScheduleWorkers");
        setSchedules(response.data);
      } catch (error) {
        console.error("Error fetching schedules:", error.message);
      }
    };

    fetchSchedules();
  }, []);

  return (
    <SafeAreaView style={styles.personalschedule}>
      <ScrollView style={styles.personalschedule}>
        <Text style={styles.header}> Your Schedule</Text>

        {schedules.map((item) => (
          <WorkersComponent key={item._id} task={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    personalschedule: {
        flex: 1,
        backgroundColor: Colors.backgroundTan,
      },
      header: {
        fontSize: 40,
        color: "#000",
        fontWeight: "bold",
        textDecorationLine: "underline",
        textAlign: "center",
        padding: 30,
      },
    })