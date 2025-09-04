import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
  Polygon,
  Circle,
  FeDropShadow,
  Filter,
} from 'react-native-svg';

// TypeScript Interfaces
interface GaugeSection {
  color: string;
  gradientStart?: string;
  gradientEnd?: string;
  startPercentage: number;
  endPercentage: number;
  label?: string;
}

interface CircularGaugeProps {
  // Core Properties
  value: number;
  maxValue: number;
  minValue?: number;

  // Size & Appearance
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;

  // Sections Configuration
  sections?: GaugeSection[];

  // Pointer Configuration
  showPointer?: boolean;
  pointerColor?: string;

  // Animation
  animationDuration?: number;
  animationDelay?: number;

  // Styling
  containerStyle?: ViewStyle;

  // Callbacks
  onAnimationComplete?: () => void;
}

const DEFAULT_SECTIONS: GaugeSection[] = [
  {
    color: '#4CAF50',
    gradientStart: '#4CAF50',
    gradientEnd: '#2E7D32',
    startPercentage: 0,
    endPercentage: 60,
    label: 'Safe',
  },
  {
    color: '#FF8800',
    gradientStart: '#FF8800',
    gradientEnd: '#FF6600',
    startPercentage: 60,
    endPercentage: 80,
    label: 'Warning',
  },
  {
    color: '#FF4444',
    gradientStart: '#FF4444',
    gradientEnd: '#CC0000',
    startPercentage: 80,
    endPercentage: 100,
    label: 'Critical',
  },
];

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  maxValue,
  minValue = 0,
  size = 200,
  strokeWidth = 24,
  backgroundColor = '#E5E7EB',
  sections = DEFAULT_SECTIONS,
  showPointer = true,
  pointerColor = '#2C3E50',
  animationDuration = 800,
  animationDelay = 0,
  containerStyle,
  onAnimationComplete,
}) => {
  // Animation values
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Calculate dimensions
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Convert value to percentage
  const percentage = Math.min(Math.max(((value - minValue) / (maxValue - minValue)) * 100, 0), 100);

  // Calculate angles for semicircle (180 degrees from left to right)
  // -90° (top) to +90° (bottom) = 180° total
  const startAngle = -90;
  const endAngle = 90;
  const totalAngle = 180;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(animationDelay),
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: animationDuration,
        useNativeDriver: false,
      }),
    ]);

    animation.start(() => {
      onAnimationComplete?.();
    });

    // Cleanup
    return () => {
      animation.stop();
    };
  }, [value, maxValue, minValue, animationDuration, animationDelay, onAnimationComplete]);

  // Helper function to convert polar coordinates to cartesian
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Create SVG path for arc sections
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const containerHeight = size * 0.6; // Semicircle height

  return (
    <View
      style={[
        { width: size, height: containerHeight, alignItems: 'center', justifyContent: 'center' },
        containerStyle,
      ]}
    >
      <Svg width={size} height={containerHeight} viewBox={`0 0 ${size} ${containerHeight}`}>
        <Defs>
          {/* Gradients for each section */}
          {sections.map((section, index) => (
            <LinearGradient
              key={`gradient-${index}`}
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <Stop
                offset="0%"
                stopColor={section.gradientStart || section.color}
                stopOpacity="1"
              />
              <Stop
                offset="100%"
                stopColor={section.gradientEnd || section.color}
                stopOpacity="1"
              />
            </LinearGradient>
          ))}

          {/* Shadow filter for pointer */}
          <Filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <FeDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
          </Filter>
        </Defs>

        <G>
          {/* Background semicircle */}
          <Path
            d={createArcPath(startAngle, endAngle, radius)}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Section arcs */}
          {sections.map((section, index) => {
            const sectionStartAngle = startAngle + (section.startPercentage / 100) * totalAngle;
            const sectionEndAngle = startAngle + (section.endPercentage / 100) * totalAngle;

            return (
              <Path
                key={`section-${index}`}
                d={createArcPath(sectionStartAngle, sectionEndAngle, radius)}
                fill="none"
                stroke={`url(#gradient-${index})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            );
          })}

          {/* Animated Pointer */}
          {showPointer && (
            <Animated.View
              style={{
                position: 'absolute',
                width: size,
                height: size,
                top: 0,
                left: 0,
                transform: [
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['-90deg', '90deg'], // Left to right across semicircle
                    }),
                  },
                ],
              }}
            >
              <Svg width={size} height={size} style={{ position: 'absolute' }}>
                {/* Pointer triangle */}
                <Polygon
                  points={`${center},${center - radius + strokeWidth / 2} ${center - 6},${
                    center - radius + strokeWidth / 2 + 12
                  } ${center + 6},${center - radius + strokeWidth / 2 + 12}`}
                  fill={pointerColor}
                  stroke="#1F2937"
                  strokeWidth="1"
                  filter="url(#shadow)"
                />
              </Svg>
            </Animated.View>
          )}
        </G>
      </Svg>
    </View>
  );
};

export default CircularGauge;
export type { CircularGaugeProps, GaugeSection };
