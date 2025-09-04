import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

// Import new modular components
import { SearchBar } from '@/components/pay/SearchBar';
import { ContactGrid } from '@/components/pay/ContactGrid';
import { RecentTransactions } from '@/components/pay/RecentTransactions';
import { AmountModal } from '@/components/pay/AmountModal';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.94:3000';

// Types
interface Contact {
  phone: string;
  vpa: string;
  name: string;
  handle: string;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  frequency?: number;
}

interface Transaction {
  id: string;
  recipientName: string;
  recipientVpa: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
  category?: string;
}

export default function PayScreen() {
  // Core state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [showAmountModal, setShowAmountModal] = useState(false);

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Load initial data
  useEffect(() => {
    loadMockData();
  }, []);

  // Filter contacts based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.vpa.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery),
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Load mock data
  const loadMockData = async () => {
    // Mock contacts data
    const mockContacts: Contact[] = [
      {
        phone: '+919876543210',
        vpa: 'john.doe@paytm',
        name: 'John Doe',
        handle: 'paytm',
        lastPaymentAmount: 500,
        lastPaymentDate: '2 days ago',
        frequency: 8,
      },
      {
        phone: '+919876543211',
        vpa: 'alice.smith@phonepe',
        name: 'Alice Smith',
        handle: 'phonepe',
        lastPaymentAmount: 1200,
        lastPaymentDate: '1 week ago',
        frequency: 3,
      },
      {
        phone: '+919876543212',
        vpa: 'bob.wilson@gpay',
        name: 'Bob Wilson',
        handle: 'gpay',
        lastPaymentAmount: 800,
        lastPaymentDate: '3 days ago',
        frequency: 12,
      },
      {
        phone: '+919876543213',
        vpa: 'sarah.johnson@paytm',
        name: 'Sarah Johnson',
        handle: 'paytm',
        lastPaymentAmount: 300,
        lastPaymentDate: '1 day ago',
        frequency: 6,
      },
      {
        phone: '+919876543214',
        vpa: 'mike.brown@phonepe',
        name: 'Mike Brown',
        handle: 'phonepe',
        lastPaymentAmount: 750,
        lastPaymentDate: '5 days ago',
        frequency: 4,
      },
      {
        phone: '+919876543215',
        vpa: 'emma.davis@gpay',
        name: 'Emma Davis',
        handle: 'gpay',
        lastPaymentAmount: 200,
        lastPaymentDate: '6 hours ago',
        frequency: 9,
      },
      {
        phone: '+919876543216',
        vpa: 'david.wilson@paytm',
        name: 'David Wilson',
        handle: 'paytm',
        lastPaymentAmount: 150,
        lastPaymentDate: '2 hours ago',
        frequency: 15,
      },
      {
        phone: '+919876543217',
        vpa: 'emma.taylor@phonepe',
        name: 'Emma Taylor',
        handle: 'phonepe',
        lastPaymentAmount: 900,
        lastPaymentDate: '4 days ago',
        frequency: 7,
      },
    ];

    // Mock transactions data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        recipientName: 'John Doe',
        recipientVpa: 'john.doe@paytm',
        amount: 500,
        status: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'Food & Dining',
      },
      {
        id: '2',
        recipientName: 'Alice Smith',
        recipientVpa: 'alice.smith@phonepe',
        amount: 1200,
        status: 'pending',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'Shopping',
      },
      {
        id: '3',
        recipientName: 'Bob Wilson',
        recipientVpa: 'bob.wilson@gpay',
        amount: 800,
        status: 'failed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Transport',
      },
    ];

    setContacts(mockContacts);
    setFilteredContacts(mockContacts);
    setRecentTransactions(mockTransactions);
  };

  // Handle contact selection
  const handleContactPress = (contact: Contact) => {
    setSelectedContact(contact);
    setShowAmountModal(true);
  };

  // Handle transaction retry
  const handleTransactionPress = (transaction: Transaction) => {
    if (transaction.status === 'failed') {
      // Find the contact for retry
      const contact = contacts.find((c) => c.vpa === transaction.recipientVpa);
      if (contact) {
        setSelectedContact(contact);
        setAmount(transaction.amount.toString());
        setShowAmountModal(true);
      }
    }
  };

  return (
    <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: 'white',
              borderBottomWidth: 1,
              borderBottomColor: DESIGN_SYSTEM.colors.neutral[200],
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.light.text,
                marginBottom: 8,
              }}
            >
              Pay Someone
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: DESIGN_SYSTEM.colors.neutral[600],
              }}
            >
              Search for contacts or enter UPI ID
            </Text>
          </View>

          {/* Search Bar */}
          <View style={{ paddingTop: 20 }}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          {/* Contact Grid */}
          <ContactGrid
            contacts={filteredContacts}
            onContactPress={handleContactPress}
            selectedContact={selectedContact}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            transactions={recentTransactions}
            onTransactionPress={handleTransactionPress}
          />

          {/* Quick UPI Input */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: DESIGN_SYSTEM.colors.neutral[200],
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => {
                // You can implement UPI ID input modal here
                Alert.alert('Coming Soon', 'Direct UPI ID input will be available soon!');
              }}
            >
              <MaterialIcons
                name="alternate-email"
                size={24}
                color={DESIGN_SYSTEM.colors.primary[500]}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: DESIGN_SYSTEM.colors.light.text,
                    marginBottom: 2,
                  }}
                >
                  Pay to UPI ID
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: DESIGN_SYSTEM.colors.neutral[600],
                  }}
                >
                  Enter UPI ID directly (e.g., user@paytm)
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={DESIGN_SYSTEM.colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Amount Modal with integrated payment flow */}
        <AmountModal
          visible={showAmountModal}
          onClose={() => {
            setShowAmountModal(false);
            setAmount('');
          }}
          amount={amount}
          onAmountChange={setAmount}
          recipientName={selectedContact?.name}
          recipientVpa={selectedContact?.vpa}
          onPaymentSuccess={(referenceId) => {
            console.log('✅ Payment completed successfully:', referenceId);
            // Let the AmountModal handle the success state and show receipt
            // Don't close the modal here - user should see the receipt first
          }}
          onPaymentFailure={(error) => {
            Alert.alert('❌ Payment Failed', error);
          }}
        />
      </View>
    </ScreenWrapper>
  );
}
