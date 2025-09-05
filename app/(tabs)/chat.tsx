import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';
import ScreenWrapper from '@/components/ScreenWrapper';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const WELCOME_MESSAGE = `Hi! I'm your AI finance assistant. I can help you with:

• 💰 Spending insights and analysis
• 📊 Budget recommendations
• 📈 Financial planning tips
• 🎯 Spending pattern analysis
• 💡 Money-saving suggestions

What would you like to know about your finances?`;

const AI_RESPONSES = {
  spending:
    "Based on your recent transactions, you've spent ₹6,304 this month with your top category being Shopping (₹3,700). You're on track to stay within your ₹40,000 monthly limit! 📊",
  budget:
    "Your current spending caps look well-balanced! Consider reducing your Shopping cap slightly since you're at 53% usage already. Your Food & Dining spending is healthy at just 10% of your cap. 🎯",
  save: "Here are some ways to save money: 1) Cook more meals at home (you're spending ₹1,100 on Food & Dining), 2) Use public transport when possible (₹205 on Transport is great!), 3) Set up automatic savings for 20% of your income. 💰",
  insights:
    "Your spending patterns show you're a balanced spender! Your highest expenses are in Shopping and Food. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. You're doing well with entertainment spending at just ₹499. 📈",
  default:
    "I'd be happy to help you with your finances! You can ask me about your spending patterns, budget optimization, saving strategies, or any financial planning questions. 💡",
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: WELCOME_MESSAGE,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes('spend') ||
      lowerMessage.includes('transaction') ||
      lowerMessage.includes('money')
    ) {
      return AI_RESPONSES.spending;
    } else if (
      lowerMessage.includes('budget') ||
      lowerMessage.includes('cap') ||
      lowerMessage.includes('limit')
    ) {
      return AI_RESPONSES.budget;
    } else if (
      lowerMessage.includes('save') ||
      lowerMessage.includes('saving') ||
      lowerMessage.includes('reduce')
    ) {
      return AI_RESPONSES.save;
    } else if (
      lowerMessage.includes('insight') ||
      lowerMessage.includes('pattern') ||
      lowerMessage.includes('analysis')
    ) {
      return AI_RESPONSES.insights;
    } else {
      return AI_RESPONSES.default;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(userMessage.text),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.aiMessage]}
    >
      <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, message.isUser ? styles.userText : styles.aiText]}>
          {message.text}
        </Text>
        <Text
          style={[styles.timestamp, message.isUser ? styles.userTimestamp : styles.aiTimestamp]}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.typingIndicator}>
          <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
          <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
          <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name="psychology" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Finance Assistant</Text>
              <Text style={styles.headerSubtitle}>{isTyping ? 'Typing...' : 'Online'}</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {isTyping && renderTypingIndicator()}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your finances..."
              placeholderTextColor={DESIGN_SYSTEM.colors.neutral[400]}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.light.background,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.primary[500],
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: DESIGN_SYSTEM.colors.neutral[800],
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: DESIGN_SYSTEM.colors.neutral[500],
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DESIGN_SYSTEM.colors.neutral[400],
    marginHorizontal: 2,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.neutral[300],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
    color: DESIGN_SYSTEM.colors.neutral[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
