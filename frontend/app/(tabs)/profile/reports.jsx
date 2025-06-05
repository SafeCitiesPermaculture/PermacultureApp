import AdminGuard from "@/components/AdminGuard";
import ReportCard from "@/components/ReportCard";
import React, { useState,useCallback } from 'react';
import API from "@/api/api";
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/constants/Colors";


const ViewReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const getReports = useCallback(async () => {
        setLoading(true);

        try {
            const response = await API.get('/reports');
            setReports(response.data.reports);
        } catch (error) {
            console.error("Error retrieving reports:", error);
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            getReports();
        }, [getReports])
    );

    return (
        <AdminGuard>
            <ScrollView contentContainerStyle={{alignItems: 'center'}}>
                <Text style={styles.header}>Click on a report to handle it</Text>
                {loading ? <ActivityIndicator size='large' color={Colors.greenRegular} /> :
                errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> :
                reports.length === 0 ? <Text>No active reports!</Text> :
                reports.map((report) => 
                <ReportCard reportedBy={report.reportedByUsername} reported={report.reportedUsername} reportId={report._id} key={report._id} description={report.description} />)}
            </ScrollView>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    header: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10
    },
    errorMessage: {
        fontSize: 30,
        color: 'red'
    }
});

export default ViewReportsPage;