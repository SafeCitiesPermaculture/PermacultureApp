//this file contains the menu bar at the bottom of the app 
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import chatForumIcon1 from 'PermacultureApp\Images\chat forum icon.png';
import homeIcon from 'Images\home icon transparent.png';
import infoIcon from 'Images\Info icon.png';
import marketplaceIcon1 from 'Images\marketplace icon.png';
import profileIcon1 from 'Images\profile icon.png';
import scheduleIcon1 from 'Images\schedule icon.png';
import colors from './color';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export function Header({ testID }) {
  const navigation = useNavigation();
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.root} testID={testID ?? "54:5"}>
      <View style={styles.rectangle5} testID="5:13" />
      <View style={styles.group11} testID="32:19">
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={homeIcon} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Info')}>
          <Image source={infoIcon} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
          <Image source={marketplaceIcon1} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Forum')}>
          <Image source={chatForumIcon1} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
          <Image source={scheduleIcon1} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={profileIcon1} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const stylesheet = createStyleSheet(theme => ({
  root: {
    width: 700,
    height: 126,
    flexShrink: 0,
  },
  rectangle5: {
    width: 700,
    height: 84,
    backgroundColor: colors.menuBrown, 
    flexShrink: 0,
  },
  group11: {
    width: 651,
    height: 126,
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 24,
  },
  icon: {
    width: 60, // match icon size appropriately
    height: 60,
    resizeMode: 'contain',
  },
}));
