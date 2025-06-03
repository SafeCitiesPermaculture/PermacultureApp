// information first page (page with overarcibg folders)
// folders for right now will be 
{/*
    Livestock
    Plants
    Plant Calendar
    Insects

    make subfolders of folders 
    ex: Livestock parent folder and then chickens, and fish are children folders and then individual files within theses
    */}

import React, { useState } from "react";
import {
    View,
    ScrollView,
    Text,
    Image,
    Button,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    onPress,
    TextInput,
    Dimensions,
} from "react-native";
import Menu from "@/components/Menu";
import Colors from "@/constants/Colors.js";
import safeCitiesLogo from '@/assets/images/logo.png';
import folders from '@/assets/images/folder 2 icon.png';
import searchGlass from '@/assets/images/maginfying glass icon.png';
import addIcon from '@/assets/images/Add _ plus icon.png';

const screenWidth = Dimensions.get('window').width;

export default function InformationMainScreen() {
    const [searchText, setSearchText] = useState('');
    return (
        <SafeAreaView style={styles.informationMainScreen}>
        <ScrollView style={styles.informationMainScreen}> 

           {/* header with logo and search box */}
          <View style={styles.headerContainer}>
            <Image source={safeCitiesLogo} style={styles.logo} />


            <View style={styles.searchBox}>
               <TextInput
                       style={styles.textInput}
                       value={searchText}
                       onChangeText={setSearchText}
                       placeholder="Search Information"
                       placeholderTextColor="#888"
                     />
              {/* magnfiying image*/}
              <Image source={searchGlass} style={styles.searchIcon} />
            </View>

          </View>

           {/*file folders */}
            <View style={styles.scrollContent}>
                  <TouchableOpacity style={styles.button} onPress={onPress}>
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Image source={folders} style={styles.folderIcons} />
                         <Text style={styles.searchText}>Livestock</Text>
                       </View>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.button} onPress={onPress}>
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Image source={folders} style={styles.folderIcons} />
                         <Text style={styles.searchText}>Plants</Text>
                       </View>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.button} onPress={onPress}>
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Image source={folders} style={styles.folderIcons} />
                         <Text style={styles.searchText}>Plant Calendar</Text>
                       </View>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.button} onPress={onPress}>
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Image source={folders} style={styles.folderIcons} />
                         <Text style={styles.searchText}>Insects</Text>
                       </View>
                    </TouchableOpacity>
            </View>

        <View>
             <TouchableOpacity
                      style={styles.add}>
              <Image source={addIcon} style={styles.plusIcon} />
              </TouchableOpacity>
            </View>
        </ScrollView>
        <Menu />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    add: {
        flex: 1,
        marginLeft: screenWidth * 0.82,
        marginTop: screenWidth * 0.99,
        },
    plusIcon: {
        flex: 1,
        width: 45,
        height: 55,
        },
    informationMainScreen: {
        flex: 1,
        backgroundColor: Colors.backgroundTan,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    folderIcons:{
        width: 40,
        height: 40,
        alignItems: 'center',
        resizeMode: 'contain',
        marginRight: 10,
        padding: 10,
        },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 10,
    },

    logo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
        marginRight: 12,
    },
    searchBox: {
         flexDirection: 'row',
         alignItems: 'center',
         backgroundColor: Colors.greyTextBox,
         borderRadius: 20,
         paddingHorizontal: 16,
         height: 40,
         flex: 1, // take remaining space
         justifyContent: 'space-between',
    },
    searchIcon: {
      width: 20,
      height: 20,
      marginLeft: 8,
    },
    searchText: {
        color: '#555',
        fontSize: 16,
    },
    searchIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    button:{
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.brownLight,
      borderRadius: 5,
      height: 45,
      justifyContent: 'space-between',
      borderWidth: 1,            // Thickness of the border
      borderColor: 'black',
        },
    textInput: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 8,
        fontSize: 16,
      },

});