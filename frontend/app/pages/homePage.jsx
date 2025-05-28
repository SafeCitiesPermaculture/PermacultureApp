import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, Text } from 'react-native';
import {menuBar} from 'menu.jsx';
import { useStyles } from 'react-native-unistyles';
import { createStyleSheet } from 'react-native-unistyles';  
import colors from './color';

import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';

const HomeScreen = () => {
  const { width, height } = Dimensions.get('window');

  return (
     <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image
          source={require('./images/logo.png')}
          style={[styles.banner, { width: width * 0.9, height: height * 0.25 }]}
        />
        <Text style={styles.title}>Hello World!</Text>
      </View>
    </ScrollView>
      {/* Footer Menu */}
      <MenuBar />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  banner: {
    resizeMode: 'cover',
    borderRadius: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default HomeScreen;
