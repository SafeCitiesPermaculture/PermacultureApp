import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import AdminGuard from "@/components/AdminGuard";
import { useLocalSearchParams, useRouter } from 'expo-router';
import API from "@/api/api";
import { useState, useEffect, useCallback } from 'react';
import Colors from "@/constants/Colors";

const { width } = Dimensions.get('window')

const ReportPage = () => {
    const { reportId } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const getReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await API.get(`/reports/${reportId}`);
            setReport(response.data.report);
        } catch (error) {
            console.error("Error fetching report:", error);
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        getReport();
    }, [getReport]);

    const handleIgnore = useCallback(async () => {
        try {
            await API.put(`/reports/dismiss/${report.reportedUsername}`);
            await API.delete(`/reports/${reportId}`);
            setMessage("Report ignored.");
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error ignoring report:", error);
            setErrorMessage(error.message);
        }
    }, [reportId, router, report]);

    const handleRemove = useCallback(async () => {
        Alert.alert(
            "Remove Usert",
            "Are you sure you want to remove this user?",
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove User',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await API.put(`/admin/remove/${report.reportedUsername}`);
                            setMessage(`${report?.reportedUsername} removed.`);
                            await API.delete(`/reports/${reportId}`);
                            setTimeout(() => router.dismiss(), 1000);
                        } catch (error) {
                            console.error("Error removing user:", error);
                            setErrorMessage(error.message);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    }, [report, router, reportId]);

    return (
        <AdminGuard>
            <View style={{alignItems: 'center', marginBottom: 7}}>
                <Text style={styles.header}>Report Details</Text>
            </View>
                {loading ? 
                <View style={{alignItems: 'center'}}>
                    <ActivityIndicator size='large' color={Colors.greenRegular} />
                </View> :
                report ? 
                <ScrollView contentContainerStyle={{marginLeft: 2, height: 'auto'}}>
                    <Text style={styles.text}>Reported: <Text style={styles.username}>{report.reportedUsername}</Text></Text>
                    <Text style={styles.text}>Reported by: <Text style={styles.username}>{report.reportedByUsername}</Text></Text>
                    <Text style={{fontSize: 16, fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 5}}>Description</Text>
                    <Text style={styles.description}>{report.description}</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 50}}>
                        <TouchableOpacity style={[styles.button, {backgroundColor: 'green'}]} onPress={handleIgnore}>
                            <Text style={styles.buttonText}>Ignore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, {backgroundColor: 'red'}]} onPress={handleRemove}>
                            <Text style={styles.buttonText}>Remove {report.reportedUsername}</Text>
                        </TouchableOpacity>
                    </View>
                    {message &&
                    <View style={{alignItems: 'center', marginTop: 15}}>
                        <Text style={{fontSize: 20, color: Colors.greenRegular}}>{message}</Text>
                    </View>}
                </ScrollView> :
                <Text style={styles.errorMessage}>{errorMessage || "Error fetching report"}</Text>
                }
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    errorMessage: {
        color: 'red',
        textAlign: 'center'
    },
    header: {
        fontSize: 30,
        fontWeight: 'bold'
    },
    username: {
        fontWeight: 'bold'
    },
    text: {
        fontSize: 16,
        marginTop: 2
    },
    description: {
        fontSize: 16,
        flexWrap: 'wrap',
        marginTop: 2
    },
    button: {
        width: width / 2 - 40,
        alignItems: 'center',
        paddingVertical: 50,
        borderRadius: 10,
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        textAlignVertical: 'center'
    }
});

export default ReportPage;