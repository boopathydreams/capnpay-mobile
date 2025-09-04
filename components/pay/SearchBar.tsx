import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search contacts, UPI ID, or phone',
  autoFocus = false,
}) => {
  return (
    <View style={styles.container}>
      <MaterialIcons
        name="search"
        size={20}
        color={DESIGN_SYSTEM.colors.neutral[500]}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={DESIGN_SYSTEM.colors.neutral[400]}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <MaterialIcons
          name="close"
          size={20}
          color={DESIGN_SYSTEM.colors.neutral[500]}
          style={styles.clearIcon}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.neutral[50],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.light.text,
    fontWeight: '400',
  },
  clearIcon: {
    marginLeft: 12,
    padding: 4,
  },
});
