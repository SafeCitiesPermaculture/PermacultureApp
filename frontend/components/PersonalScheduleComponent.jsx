import React, {useState,  useEffect} from "react";
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
} from "react-native";
import safeCitiesLogo from "@/assets/images/logo.png";
import { useRouter, usePathname } from "expo-router";
import Colors from "@/constants/Colors";
import addIcon from "@/assets/images/Add _ plus icon.png";
import { Picker } from '@react-native-picker/picker';
import API from "@/api/api";


export default function CheckBox({task,deleteTask}) {

    {/* function to keep track if checkbox is checked when they complete a task */}
      const handlePress = () => {
        deleteTask(task._id);

      };

    const formattedDate = new Date(task.date).toLocaleDateString();
    const formattedTime = new Date(task.time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  return(
         <View style={styles.taskContainer}>
              <TouchableOpacity style={styles.checkBox} onPress={handlePress}>
            </TouchableOpacity>
            <View style={styles.textContainer}>
            <Text style={styles.taskText}> {task.task} </Text>
            <Text style={styles.subText}> Due: {formattedDate} at {formattedTime} </Text>
            </View>
          </View>
  );
}


const styles = StyleSheet.create({
     taskContainer:{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors.greenRegular,
            borderRadius: 5,
            height: 55,
            justifyContent: "flex-start",
            borderWidth: 1, // Thickness of the border
            borderColor: "black",
            padding: 10,
            },
        checkBox:{
             width: 25,
             height: 25,
             justifyContent: "center",  // center content vertically
             alignItems: "center",      // center content horizontally
             marginLeft: 10,
             borderWidth: 1,
             borderColor: "black",
             backgroundColor: Colors.backgroundTan,
            },
        xText: {
          color: "black",   // ensure it's visible
          fontWeight: "bold",
          fontSize: 16,
        },
        textContainer:{
            flex: 1,
            flexDirection: "column",
            alignItems: "left",
            marginLeft: 15,
            },
        taskText:{
            fontSize: 18,
            color: "black",
            fontWeight: "bold",
            },
        subText:{
            font: 15,
            color: "dark gray",
            },
        personalschedule:{
             flex: 1,
             backgroundColor: Colors.backgroundTan,
            },
    });