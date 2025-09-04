import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');

interface Contact {
  phone: string;
  vpa: string;
  name: string;
  handle: string;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  frequency?: number;
}

interface ContactGridProps {
  contacts: Contact[];
  onContactPress: (contact: Contact) => void;
  selectedContact?: Contact | null;
}

export const ContactGrid: React.FC<ContactGridProps> = ({
  contacts,
  onContactPress,
  selectedContact,
}) => {
  const getContactInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getFrequencyColor = (frequency?: number) => {
    if (!frequency || frequency <= 3) return DESIGN_SYSTEM.colors.neutral[300];
    if (frequency <= 7) return DESIGN_SYSTEM.colors.primary[300];
    return DESIGN_SYSTEM.colors.success[400];
  };

  // Calculate responsive width for 4 columns
  const itemWidth = (screenWidth - 80) / 4; // 20px margin + 20px padding on each side + gaps

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Contacts</Text>
      <View style={styles.grid}>
        {contacts.slice(0, 8).map((contact, index) => {
          const isSelected = selectedContact?.vpa === contact.vpa;
          return (
            <TouchableOpacity
              key={contact.vpa}
              style={[styles.contactItem, { width: itemWidth }, isSelected && styles.selectedItem]}
              onPress={() => onContactPress(contact)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, isSelected && styles.selectedAvatar]}>
                <Text style={[styles.avatarText, isSelected && styles.selectedAvatarText]}>
                  {getContactInitials(contact.name)}
                </Text>

                {/* Frequency indicator */}
                {contact.frequency && contact.frequency > 5 && (
                  <View
                    style={[
                      styles.frequencyIndicator,
                      { backgroundColor: getFrequencyColor(contact.frequency) },
                    ]}
                  />
                )}
              </View>

              <Text style={styles.contactName} numberOfLines={1}>
                {contact.name.split(' ')[0]}
              </Text>

              <Text style={styles.handleText} numberOfLines={1}>
                @{contact.handle}
              </Text>

              {/* {contact.lastPaymentAmount && (
                <Text style={styles.lastPayment}>
                  ₹{contact.lastPaymentAmount.toLocaleString('en-IN')}
                </Text>
              )} */}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.light.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactItem: {
    alignItems: 'center',
    padding: 4,
    // borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    // backgroundColor: 'white',
    // borderWidth: 1,
    // borderColor: DESIGN_SYSTEM.colors.neutral[200],
    minHeight: 110,
  },
  selectedItem: {
    // borderColor: DESIGN_SYSTEM.colors.primary[500],
    // borderWidth: 2,
    backgroundColor: DESIGN_SYSTEM.colors.primary[50],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DESIGN_SYSTEM.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  selectedAvatar: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary[700],
  },
  selectedAvatarText: {
    color: 'white',
  },
  frequencyIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: DESIGN_SYSTEM.colors.light.text,
    marginBottom: 2,
  },
  handleText: {
    fontSize: 10,
    color: DESIGN_SYSTEM.colors.neutral[500],
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 2,
  },
  lastPayment: {
    fontSize: 10,
    color: DESIGN_SYSTEM.colors.success[600],
    fontWeight: '600',
    textAlign: 'center',
  },
});
