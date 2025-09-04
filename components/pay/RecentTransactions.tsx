import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

interface Transaction {
  id: string;
  recipientName: string;
  recipientVpa: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
  category?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onSeeAllPress?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onTransactionPress,
  onSeeAllPress,
}) => {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return (
          <MaterialIcons name="check-circle" size={20} color={DESIGN_SYSTEM.colors.success[500]} />
        );
      case 'pending':
        return (
          <MaterialIcons name="schedule" size={20} color={DESIGN_SYSTEM.colors.warning[500]} />
        );
      case 'failed':
        return <MaterialIcons name="error" size={20} color={DESIGN_SYSTEM.colors.error[500]} />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return DESIGN_SYSTEM.colors.success[500];
      case 'pending':
        return DESIGN_SYSTEM.colors.warning[500];
      case 'failed':
        return DESIGN_SYSTEM.colors.error[500];
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.transactionsList}>
        {transactions.slice(0, 3).map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionItem}
            onPress={() => onTransactionPress?.(transaction)}
            activeOpacity={0.7}
          >
            <View style={styles.transactionLeft}>
              <View style={styles.statusIcon}>{getStatusIcon(transaction.status)}</View>

              <View style={styles.transactionDetails}>
                <Text style={styles.recipientName} numberOfLines={1}>
                  {transaction.recipientName}
                </Text>
                <View style={styles.transactionMeta}>
                  <Text style={styles.vpaText} numberOfLines={1}>
                    {transaction.recipientVpa}
                  </Text>
                  {transaction.category && (
                    <>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.categoryText}>{transaction.category}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.transactionRight}>
              <Text style={[styles.amountText, { color: getStatusColor(transaction.status) }]}>
                ₹{transaction.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.timeText}>{getTimeAgo(transaction.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.light.text,
  },
  seeAllText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.primary[600],
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.light.text,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vpaText: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.neutral[500],
    flex: 1,
  },
  separator: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.neutral[400],
    marginHorizontal: 6,
  },
  categoryText: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.primary[600],
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.neutral[500],
  },
});
