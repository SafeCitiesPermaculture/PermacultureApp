import React from 'react';
import {View, ScrollView, Text, Button, StyleSheet} from 'react-native';
import Menu from './menu.jsx';
import colors from '@/constants/Colors.js';


export default function Homescreen(){
    return(
    <SafeAreaView style={styles.homescreen}>
        <Text style={texts.header}> WHO WE ARE </Text>
        <Text style={texts.body}>
        Safe Cities is a Non Profit Organization based in Elsies River. We focus on Social Development and Skills Training, such as Capacity Building & Theatre Training, Construction Skills Training, Perma-Culture Skills Training, Young Leaders Initiative Program, and Wellness & Women Empowerment Program.
      </Text>
      <Text style={texts.header}> VISION & MISSION </Text>
      <Text style={texts.body}>
      Our vision is to ensure that individuals have the opportunity to be trained and equipped, through our programs. This will better prepare them for an evolving society. We focus on leadership training, self-sustainability and community upliftment. We believe in empowering and educating, youth, women, men and children.
    </Text>
    <Menu />

    </SafeAreaView>
    );
    }

const texts = StyleSheet.create({
    header:{
        fontSize: 40,
        padding: 24,
        },
    body: {
        fontSize: 25,
        padding: 20,
        },
    });
const styles =StyleSheet.create({
   homescreen:{
       flex:1,
       color: colors.backgroundTan,
       },
    });