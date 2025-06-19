import { View, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";


const PasswordInput = ({ value, placeholder="Password...", onChangeText, style, ...rest }) => {
    const [visible, setVisible] = useState(false);

    const toggleVisibility = () => {
        setVisible(!visible);
    }

    return (
        <View style={[styles.container, style]}>
            <TextInput 
                key="Password-visibility-toggle-input"
                style={styles.textInput}
                placeholder={placeholder}
                secureTextEntry={!visible}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
                {...rest}
                /> 
            <TouchableOpacity style={styles.toggleButton} onPress={toggleVisibility}>
                <Ionicons
                    name={visible ? 'eye-off' : 'eye'}
                    size={24}
                    color='#3d3c38'
                    />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 40,
        alignItems: 'center',
        marginBottom: 15,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingLeft: 12,
        height: "100%"
    },
    toggleButton: {
        padding: 8
    }
});

export default PasswordInput;