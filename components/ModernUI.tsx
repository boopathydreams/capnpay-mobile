import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

// Modern Card Component
interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'glass';
  className?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function ModernCard({
  children,
  variant = 'elevated',
  className = '',
  style,
  onPress
}: ModernCardProps) {
  const cardStyle = variant === 'glass'
    ? styles.glassCard
    : styles.elevatedCard;

  const Component = onPress ? Pressable : View;

  return (
    <Component
      className={`${className}`}
      style={[cardStyle, style]}
      onPress={onPress}
      android_ripple={onPress ? { color: 'rgba(0,0,0,0.05)' } : undefined}
    >
      {children}
    </Component>
  );
}

// Modern Button Component
interface ModernButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function ModernButton({
  title,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  icon,
  className = ''
}: ModernButtonProps) {
  const buttonStyle = getButtonStyle(variant, size);
  const textStyle = getButtonTextStyle(variant, size);

  return (
    <Pressable
      className={`flex-row items-center justify-center ${className}`}
      style={[buttonStyle, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text style={textStyle}>{loading ? 'Loading...' : title}</Text>
    </Pressable>
  );
}

// Typography Components
interface TypographyProps {
  children: React.ReactNode;
  color?: string;
  style?: any;
  className?: string;
  numberOfLines?: number;
}

export const DisplayText: React.FC<TypographyProps> = ({
  children,
  color = DESIGN_SYSTEM.colors.neutral[900],
  style,
  className,
  numberOfLines,
  ...props
}) => (
  <Text
    style={[
      {
        fontSize: DESIGN_SYSTEM.typography.display.fontSize,
        fontWeight: DESIGN_SYSTEM.typography.display.fontWeight as any,
        lineHeight: DESIGN_SYSTEM.typography.display.fontSize * DESIGN_SYSTEM.typography.display.lineHeight,
        color,
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      style,
    ]}
    className={className}
    numberOfLines={numberOfLines}
    {...props}
  >
    {children}
  </Text>
);

export const HeadingText: React.FC<TypographyProps> = ({
  children,
  color = DESIGN_SYSTEM.colors.neutral[900],
  style,
  className,
  numberOfLines,
  ...props
}) => (
  <Text
    style={[
      {
        fontSize: DESIGN_SYSTEM.typography.h2.fontSize,
        fontWeight: DESIGN_SYSTEM.typography.h2.fontWeight as any,
        lineHeight: DESIGN_SYSTEM.typography.h2.fontSize * DESIGN_SYSTEM.typography.h2.lineHeight,
        color,
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      style,
    ]}
    className={className}
    numberOfLines={numberOfLines}
    {...props}
  >
    {children}
  </Text>
);

export const BodyText: React.FC<TypographyProps> = ({
  children,
  color = DESIGN_SYSTEM.colors.neutral[700],
  style,
  className,
  numberOfLines,
  ...props
}) => (
  <Text
    style={[
      {
        fontSize: DESIGN_SYSTEM.typography.body.fontSize,
        fontWeight: DESIGN_SYSTEM.typography.body.fontWeight as any,
        lineHeight: DESIGN_SYSTEM.typography.body.fontSize * DESIGN_SYSTEM.typography.body.lineHeight,
        color,
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      style,
    ]}
    className={className}
    numberOfLines={numberOfLines}
    {...props}
  >
    {children}
  </Text>
);

export const CaptionText: React.FC<TypographyProps> = ({
  children,
  color = DESIGN_SYSTEM.colors.neutral[500],
  style,
  className,
  numberOfLines,
  ...props
}) => (
  <Text
    style={[
      {
        fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
        fontWeight: DESIGN_SYSTEM.typography.caption.fontWeight as any,
        lineHeight: DESIGN_SYSTEM.typography.caption.fontSize * DESIGN_SYSTEM.typography.caption.lineHeight,
        color,
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      style,
    ]}
    className={className}
    numberOfLines={numberOfLines}
    {...props}
  >
    {children}
  </Text>
);

// Helper functions
function getButtonStyle(variant: string, size: string) {
  const base = {
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    ...DESIGN_SYSTEM.shadows.md,
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    },
    secondary: {
      backgroundColor: DESIGN_SYSTEM.colors.neutral[0],
      borderWidth: 1,
      borderColor: DESIGN_SYSTEM.colors.neutral[200],
    },
    ghost: {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    }
  };

  return {
    ...base,
    ...sizeStyles[size as keyof typeof sizeStyles],
    ...variantStyles[variant as keyof typeof variantStyles],
  };
}

function getButtonTextStyle(variant: string, size: string) {
  const base = DESIGN_SYSTEM.typography.button;

  const sizeStyles = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  const variantStyles = {
    primary: { color: DESIGN_SYSTEM.colors.neutral[0] },
    secondary: { color: DESIGN_SYSTEM.colors.neutral[900] },
    ghost: { color: DESIGN_SYSTEM.colors.primary[500] },
  };

  return {
    ...base,
    ...sizeStyles[size as keyof typeof sizeStyles],
    ...variantStyles[variant as keyof typeof variantStyles],
  };
}

const styles = {
  elevatedCard: {
    backgroundColor: DESIGN_SYSTEM.colors.neutral[0],
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    padding: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.lg,
  },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: DESIGN_SYSTEM.spacing.lg,
  },

  disabled: {
    opacity: 0.5,
  },
};
