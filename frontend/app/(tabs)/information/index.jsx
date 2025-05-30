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

import React from "react";
import {
    View,
    ScrollView,
    Text,
    Image,
    Button,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import Menu from "@/components/Menu";
import Colors from "@/constants/Colors.js";
import safeCitiesLogo from '@/assets/images/logo.png';
import folders from '@/assets/images/folder 2 icon.png'

export default function InformationMainScreen() {
    return (
        <SafeAreaView style={styles.informationMainScreen}>
        <ScrollView style={styles.informationMainScreen}> 

           // header with logo and search box 
            <Image source = {safeCitiesLogo} style = {styles.logo}/>
            <View style={styles.searchbox}>
                <Text style={styles.boxText}>SearchInformation</Text>
                <Image source={require('@\assets\images\maginfying glass icon.png')} style={styles.searchIcon} />
            </View>

           // file folders 
            <View style={styles.scrollContent}>
                <View style={styles.header}>
                    <Image source={folders} style={styles.logo} />
                    <Text style={styles.textHeader}>Information</Text>
                </View>
                <Text style={styles.subtext}>Explore our information folders:</Text>
                <Button title="Livestock" onPress={() => console.log('Navigate to Livestock')} />
                <Button title="Plants" onPress={() => console.log('Navigate to Plants')} />
                <Button title="Plant Calendar" onPress={() => console.log('Navigate to Plant Calendar')} />
                <Button title="Insects" onPress={() => console.log('Navigate to Insects')} />
            </View>
        
        </ScrollView>
        <Menu />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    logo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
        marginRight: 10,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.greyTextBox,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        justifyContent: 'space-between',
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
});