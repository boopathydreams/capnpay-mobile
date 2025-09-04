import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import GaugeTest from '@/components/GaugeTest';


export default function TestScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="headlineSmall" style={styles.title}>
                    Gauge Test Component
                </Text>
                <View style={styles.gaugeContainer}>
                    <GaugeTest />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: '600',
    },
    gaugeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});