import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius } from '../../theme/colors'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    )
    animation.start()
    return () => animation.stop()
  }, [shimmerAnim])

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  })

  return (
    <View
      style={[
        styles.container,
        {
          width: width as number,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  )
}

interface SkeletonGroupProps {
  lines?: number
  spacing?: number
  lastWidth?: string
}

export function SkeletonGroup({ lines = 3, spacing = 10, lastWidth = '60%' }: SkeletonGroupProps) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastWidth : '100%'}
          height={14}
          style={i < lines - 1 ? { marginBottom: spacing } : undefined}
        />
      ))}
    </View>
  )
}

interface SkeletonCardProps {
  style?: StyleProp<ViewStyle>
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonGroup lines={2} spacing={8} lastWidth="80%" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceHover,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
})
