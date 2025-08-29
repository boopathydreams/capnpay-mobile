import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/constants/AppConstants';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function ScreenWrapper({ children, className, style }: ScreenWrapperProps) {
  return (
    <SafeAreaView
      edges={['top']}
      className={`flex-1 bg-gray-50 ${className || ''}`}
      style={[styles.container, style]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default ScreenWrapper;
