import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircularGauge from './CircularGauge';

const GaugeTest: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clean CircularGauge Test</Text>

      {/* Budget Usage Gauge */}
      <View style={styles.gaugeSection}>
        <Text style={styles.sectionTitle}>Budget Usage - 85%</Text>
        <CircularGauge
          value={85}
          maxValue={100}
          size={200}
          strokeWidth={24}
          showPointer={true}
          sections={[
            {
              color: '#10B981',
              gradientStart: '#10B981',
              gradientEnd: '#059669',
              startPercentage: 0,
              endPercentage: 60,
              label: 'Safe',
            },
            {
              color: '#F59E0B',
              gradientStart: '#F59E0B',
              gradientEnd: '#D97706',
              startPercentage: 60,
              endPercentage: 80,
              label: 'Warning',
            },
            {
              color: '#EF4444',
              gradientStart: '#EF4444',
              gradientEnd: '#DC2626',
              startPercentage: 80,
              endPercentage: 100,
              label: 'Critical',
            },
          ]}
          animationDuration={2000}
        />
        <Text style={styles.valueDisplay}>85% used</Text>
      </View>

      {/* Performance Gauge */}
      <View style={styles.gaugeSection}>
        <Text style={styles.sectionTitle}>Performance Score - 75%</Text>
        <CircularGauge
          value={75}
          maxValue={100}
          size={180}
          strokeWidth={20}
          animationDuration={1500}
          containerStyle={styles.performanceGauge}
        />
        <Text style={styles.valueDisplay}>75/100</Text>
      </View>

      {/* Currency Gauge */}
      <View style={styles.gaugeSection}>
        <Text style={styles.sectionTitle}>Spending - ₹4,700</Text>
        <CircularGauge
          value={4700}
          maxValue={5000}
          size={160}
          strokeWidth={16}
          animationDuration={1000}
        />
        <Text style={styles.valueDisplay}>₹4,700 of ₹5,000</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2C3E50',
  },
  gaugeSection: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  valueDisplay: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    color: '#666',
  },
  performanceGauge: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
  },
});

export default GaugeTest;
