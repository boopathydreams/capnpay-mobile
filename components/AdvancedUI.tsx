import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { DESIGN_SYSTEM } from '../constants/DesignSystem';

// Card Components
interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  onPress?: () => void;
  variant?: 'default' | 'hero' | 'surface' | 'dark';
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  className,
  onPress,
  variant = 'default'
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'hero':
        return {
          backgroundColor: DESIGN_SYSTEM.colors.primary[500],
          borderRadius: DESIGN_SYSTEM.borderRadius['2xl'],
          ...DESIGN_SYSTEM.shadows.xl,
        };
      case 'surface':
        return {
          backgroundColor: DESIGN_SYSTEM.colors.neutral[50],
          borderRadius: DESIGN_SYSTEM.borderRadius.xl,
          ...DESIGN_SYSTEM.shadows.md,
        };
      case 'dark':
        return {
          backgroundColor: DESIGN_SYSTEM.colors.dark.surface,
          borderRadius: DESIGN_SYSTEM.borderRadius.xl,
          ...DESIGN_SYSTEM.shadows.lg,
        };
      default:
        return {
          backgroundColor: DESIGN_SYSTEM.colors.neutral[0],
          borderRadius: DESIGN_SYSTEM.borderRadius.lg,
          ...DESIGN_SYSTEM.shadows.sm,
        };
    }
  };

  const cardStyle = [
    {
      padding: DESIGN_SYSTEM.spacing.lg,
      ...getVariantStyle(),
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          { opacity: pressed ? 0.95 : 1 },
        ]}
        className={className}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} className={className}>
      {children}
    </View>
  );
};

// Status Chip Component
interface StatusChipProps {
  status: 'ok' | 'near' | 'over';
  children: React.ReactNode;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, children }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ok': return DESIGN_SYSTEM.status.ok;
      case 'near': return DESIGN_SYSTEM.status.near;
      case 'over': return DESIGN_SYSTEM.status.over;
      default: return DESIGN_SYSTEM.status.info;
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: `${getStatusColor()}20`,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: getStatusColor(),
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {children}
      </Text>
    </View>
  );
};

// Progress Ring Component (for the hero section)
interface ProgressRingProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  children
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Background ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: DESIGN_SYSTEM.colors.primary[700],
          position: 'absolute',
        }}
      />
      {/* Progress ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: DESIGN_SYSTEM.colors.primary[300],
          borderTopColor: DESIGN_SYSTEM.colors.primary[300],
          borderRightColor: DESIGN_SYSTEM.colors.primary[300],
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: `${-90 + (progress * 360)}deg` }],
          position: 'absolute',
        }}
      />
      {/* Content */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
};

// Metric Tile Component
interface MetricTileProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  title,
  value,
  subtitle,
  color = DESIGN_SYSTEM.colors.primary[500]
}) => (
  <ModernCard variant="surface" style={{ flex: 1, margin: 4 }}>
    <CaptionText style={{ color: color, marginBottom: 4, textTransform: 'uppercase' }}>
      {title}
    </CaptionText>
    <HeadingText style={{ fontSize: 20, fontWeight: '700', marginBottom: 2 }}>
      {value}
    </HeadingText>
    {subtitle && (
      <CaptionText style={{ color: DESIGN_SYSTEM.colors.neutral[500] }}>
        {subtitle}
      </CaptionText>
    )}
  </ModernCard>
);

// Progress Bar Component with dynamic colors
interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  animated = true
}) => {
  const getProgressColor = () => {
    if (progress >= 1) return DESIGN_SYSTEM.status.over;
    if (progress >= 0.8) return DESIGN_SYSTEM.status.near;
    return DESIGN_SYSTEM.status.ok;
  };

  return (
    <View
      style={{
        height,
        backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.min(progress * 100, 100)}%`,
          backgroundColor: getProgressColor(),
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};

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

// Modern Button Component
interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  className?: string;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  style,
  className,
  ...props
}) => {
  const getButtonStyle = () => {
    const base = {
      borderRadius: DESIGN_SYSTEM.borderRadius.md,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
    };

    const sizes = {
      sm: { paddingHorizontal: DESIGN_SYSTEM.spacing.md, paddingVertical: DESIGN_SYSTEM.spacing.sm, minHeight: 36 },
      md: { paddingHorizontal: DESIGN_SYSTEM.spacing.lg, paddingVertical: DESIGN_SYSTEM.spacing.md, minHeight: 44 },
      lg: { paddingHorizontal: DESIGN_SYSTEM.spacing.xl, paddingVertical: DESIGN_SYSTEM.spacing.lg, minHeight: 52 },
    };

    const variants = {
      primary: {
        backgroundColor: DESIGN_SYSTEM.colors.primary[500],
        ...DESIGN_SYSTEM.shadows.md,
      },
      secondary: {
        backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
        borderWidth: 1,
        borderColor: DESIGN_SYSTEM.colors.neutral[200],
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...base,
      ...sizes[size],
      ...variants[variant],
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = () => {
    const base = {
      fontSize: DESIGN_SYSTEM.typography.button.fontSize,
      fontWeight: DESIGN_SYSTEM.typography.button.fontWeight as any,
      lineHeight: DESIGN_SYSTEM.typography.button.fontSize * DESIGN_SYSTEM.typography.button.lineHeight,
    };

    const colors = {
      primary: DESIGN_SYSTEM.colors.neutral[0],
      secondary: DESIGN_SYSTEM.colors.neutral[700],
      ghost: DESIGN_SYSTEM.colors.primary[500],
    };

    return {
      ...base,
      color: colors[variant],
    };
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyle(),
        { opacity: pressed ? 0.9 : disabled ? 0.5 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      className={className}
      {...props}
    >
      <Text style={getTextStyle()}>{children}</Text>
    </Pressable>
  );
};
