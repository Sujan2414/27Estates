import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { haptic } from '@/lib/haptics'
import { colors, radius } from '@/theme/colors'

const PIPELINE_STEPS = [
  { key: 'new',          label: 'New' },
  { key: 'contacted',    label: 'Contacted' },
  { key: 'qualified',    label: 'Qualified' },
  { key: 'negotiation',  label: 'Negotiation' },
  { key: 'site_visit',   label: 'Site Visit' },
  { key: 'converted',    label: 'Converted' },
]

function getStepIndex(status: string): number {
  return PIPELINE_STEPS.findIndex(s => s.key === status)
}

interface PipelineBarProps {
  currentStatus: string
  onStatusChange: (status: string) => void
}

export function PipelineBar({ currentStatus, onStatusChange }: PipelineBarProps) {
  const currentIndex = getStepIndex(currentStatus)

  function handlePress(key: string) {
    haptic.light()
    onStatusChange(key)
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {PIPELINE_STEPS.map((step, index) => {
          const isCurrent = step.key === currentStatus
          const isDone = index < currentIndex
          const isFuture = index > currentIndex

          return (
            <View key={step.key} style={styles.stepWrapper}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    (isDone || isCurrent) && styles.connectorActive,
                  ]}
                />
              )}
              <Pressable
                style={[
                  styles.step,
                  isDone && styles.stepDone,
                  isCurrent && styles.stepCurrent,
                  isFuture && styles.stepFuture,
                ]}
                onPress={() => handlePress(step.key)}
                activeOpacity={0.8}
              >
                {isDone ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <View
                    style={[
                      styles.dot,
                      isCurrent && styles.dotCurrent,
                      isFuture && styles.dotFuture,
                    ]}
                  />
                )}
              </Pressable>
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isDone && styles.stepLabelDone,
                  isFuture && styles.stepLabelFuture,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 14,
  },
  container: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepWrapper: {
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'column',
  },
  connector: {
    position: 'absolute',
    top: 14,
    right: '50%',
    left: '-50%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  connectorActive: {
    backgroundColor: colors.primary,
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    zIndex: 1,
    marginHorizontal: 20,
  },
  stepDone: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  stepCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  stepFuture: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
  },
  dotCurrent: {
    backgroundColor: colors.textInverse,
  },
  dotFuture: {
    backgroundColor: colors.textDisabled,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 70,
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepLabelDone: {
    color: colors.textSecondary,
  },
  stepLabelFuture: {
    color: colors.textDisabled,
  },
})
