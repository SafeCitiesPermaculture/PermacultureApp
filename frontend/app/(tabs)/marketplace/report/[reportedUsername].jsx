import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Keyboard} from 'react-native';
import API from "@/api/api";
import AuthGuard from "@/components/AuthGuard";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useContext } from 'react';
import Colors from "@/constants/Colors";
import { AuthContext } from "@/context/AuthContext";

const reportPage = () => {
    const { reportedUsername } = useLocalSearchParams();
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { userData } = useContext(AuthContext);
    const router = useRouter();

    const handleSubmit = async () => {
        Keyboard.dismiss();
        
        if (!description.trim()) {
            setMessage("Description is required.");
            return;
        }

        setLoading(true);
        setMessage("");
        try {
            const reportData = {
                reportedUsername: reportedUsername,
                reportedByUsername: userData?.username,
                description: description
            };

            const response = await API.post('/reports', reportData);
            setMessage("Report successfully created.");
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error creating listing: ", error);
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <View style={styles.container}>
                <Text style={{fontSize: 30, fontWeight:'bold'}}>Reporting {reportedUsername}</Text>
                <TextInput 
                    placeholder="Enter a description of your report. Mention specific listing(s) or message(s) if applicable." 
                    defaultvalue={description}
                    onChangeText={(newDescription) => setDescription(newDescription)}
                    maxLength={500}
                    multiline={true}
                    numberOfLines={6}
                    style={styles.textInput} />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.text}>Submit</Text>
                </TouchableOpacity>
                {loading ? <ActivityIndicator size="large" color={Colors.greenRegular} /> : 
                <View style={{marginTop: 10}}>
                    <Text style={styles.message}>{message}</Text>
                </View>}
            </View>
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.brownLight,
        width: 300,
        marginTop: 15
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    button: {
        backgroundColor: Colors.greenButton,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 2,
        marginTop: 10,
    },
    message: {
        fontSize: 16,
        color: Colors.greenRegular
    }
});

export default reportPage;