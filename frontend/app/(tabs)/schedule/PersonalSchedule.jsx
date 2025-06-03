// page for both admin and public to create and view their schedules

import React, {useState} from "react";
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

const { width } = Dimensions.get("window");



export default function PersonalSchedulePage() {
    const [modalVisible, setModalVisible] = useState(false);
    const [task, setTask] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [priority, setPriority] = useState("");
    return(
    <SafeAreaView style={styles.personalschedule}>
    <ScrollView style={styles.personalschedule} >
        <Text style={styles.header}> Schedule </Text>


        <View style={styles.add}>
            <TouchableOpacity style={styles.add} onPress={() => setModalVisible(true)}>
                <Image source={addIcon} style={styles.plusIcon} />
            </TouchableOpacity>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
            <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                    <View style={styles.PromptsContainer}> {/*holds input prompts*/}
                        <Text style={styles.prompts}> Task </Text>
                        <View style={styles.InputBox}>
                            <TextInput
                                style={styles.textInput}
                                value={task}
                                onChangeText={setTask}
                            />
                        </View>
                    </View>

                    <View style={styles.PromptsContainer}> {/*holds input prompts*/}
                        <Text style={styles.prompts}> Date </Text>
                        <View style={styles.InputBox}>
                            <TextInput
                                style={styles.textInput}
                                value={date}
                                onChangeText={setDate}
                            />
                        </View>
                    </View>

                    <View style={styles.PromptsContainer}> {/*holds input prompts*/}
                        <Text style={styles.prompts}> Time </Text>
                        <View style={styles.InputBox}>
                            <TextInput
                                style={styles.textInput}
                                value={time}
                                onChangeText={setTime}
                            />
                        </View>
                    </View>

                <View style={styles.PromptsContainer}> {/* Priority dropdown */}
                 <View style={{ flexDirection: "column", flex: 1 }}>
                   <Text style={styles.prompts}> Priority: </Text>
                     <Text style={{ marginBottom: 5, fontSize: 16, color: "#333" }}>
                       </Text>
                   <View style={styles.InputBox}>
                     <Picker
                       selectedValue={priority}
                       onValueChange={(itemValue) => setPriority(itemValue)}
                       style={styles.picker}
                       dropdownIconColor="#000"
                     >
                       <Picker.Item label="Select Priority" value="" enabled={false} />
                       <Picker.Item label="None" value="None" />
                       <Picker.Item label="Low" value="Low" />
                       <Picker.Item label="Medium" value="Medium" />
                       <Picker.Item label="High" value="High" />
                     </Picker>
                   </View>
                 </View>
                </View>


                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Text style={{ color: "white" }}>Close</Text>
                  </TouchableOpacity>
                </View>
            </View>
            </Modal>
        </View>
    </ScrollView>
    </SafeAreaView>
);
}

const styles = StyleSheet.create({
    personalschedule:{
         flex: 1,
         backgroundColor: Colors.backgroundTan,
        },
    header:{
        fontSize: 40,
        color: "#000",
        fontWeight: "bold",
        textDecorationLine: "underline",
        textAlign: "center",
        },
    add:{
        position: "absolute",
        right: 5,
        top: 340,
        },
    plusIcon:{
         width: 60,
         height: 60,
         resizeMode: "contain",
        },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: 300,
      padding: 20,
      backgroundColor: 'white',
      borderRadius: 10,
      alignItems: 'center',
    },
    modalText: {
      fontSize: 18,
      marginBottom: 10,
    },
    closeButton: {
      backgroundColor: '#333',
      padding: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    PromptsContainer:{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        marginTop: 10,
        },
    prompts:{
        fontSize: 18,
        fontWeight: "bold",
        padding: 2,
        },
    InputBox:{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.greyTextBox,
        borderRadius: 20,
        paddingHorizontal:16,
        height: 50,
        flex: 1,
        justifyContent: "space-between",
        },
    textInput:{
         color: "black",
        fontSize: 15,},
    picker: {
      flex: 1,
      color: "black",
      backgroundColor: "transparent",
    },


    });