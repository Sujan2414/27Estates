import {
  View, Text, Pressable, Modal, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { haptic } from '@/lib/haptics'
import { colors, radius, shadows } from '@/theme/colors'

export interface CallSummaryData {
  temperature: 'HOT' | 'WARM' | 'COLD' | 'DEAD'
  confidence: number
  summary: string
  signals: {
    positive: string[]
    negative: string[]
  }
  next_action: string
  duration_seconds: number
}

interface CallSummarySheetProps {
  visible: boolean
  onClose: () => void
  onSave: (data: CallSummaryData) => void
  leadName: string
  summary: CallSummaryData | null
  loading: boolean
}

const TEMP_CONFIG: Record<
  CallSummaryData['temperature'],
  { bg: string; text: string; label: string }
> = {
  HOT:  { bg: colors.hotBg,       text: colors.hot,      label: 'HOT' },
  WARM: { bg: colors.warmBg,      text: colors.warm,     label: 'WARM' },
  COLD: { bg: colors.coldBg,      text: colors.cold,     label: 'COLD' },
  DEAD: { bg: colors.deadBg,      text: colors.dead,     label: 'DEAD' },
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function CallSummarySheet({
  visible,
  onClose,
  onSave,
  leadName,
  summary,
  loading,
}: CallSummarySheetProps) {
  function handleSave() {
    if (!summary) return
    haptic.light()
    onSave(summary)
  }

  function handleEditNotes() {
    haptic.light()
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose}  />
        <View style={[styles.sheet, shadows.modal]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Call Summary</Text>
            <Text style={styles.sheetSubtitle}>{leadName}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingTitle}>AI is analysing your call...</Text>
              <Text style={styles.loadingSubtitle}>
                Processing conversation signals and extracting insights
              </Text>
            </View>
          ) : summary ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Temperature + Confidence */}
              <View style={styles.tempRow}>
                <View
                  style={[
                    styles.tempBadge,
                    { backgroundColor: TEMP_CONFIG[summary.temperature].bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.tempLabel,
                      { color: TEMP_CONFIG[summary.temperature].text },
                    ]}
                  >
                    {TEMP_CONFIG[summary.temperature].label}
                  </Text>
                </View>
                <View style={styles.tempMeta}>
                  <Text style={styles.confidenceLabel}>
                    {summary.confidence}% confidence
                  </Text>
                  <Text style={styles.durationLabel}>
                    Call duration: {formatDuration(summary.duration_seconds)}
                  </Text>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SUMMARY</Text>
                <Text style={styles.summaryText}>{summary.summary}</Text>
              </View>

              {/* Positive signals */}
              {summary.signals.positive.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>POSITIVE SIGNALS</Text>
                  {summary.signals.positive.map((signal, i) => (
                    <View key={i} style={styles.signalRow}>
                      <Text style={styles.signalIconPositive}>✓</Text>
                      <Text style={styles.signalTextPositive}>{signal}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Negative signals */}
              {summary.signals.negative.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>CONCERNS</Text>
                  {summary.signals.negative.map((signal, i) => (
                    <View key={i} style={styles.signalRow}>
                      <Text style={styles.signalIconNegative}>⚠</Text>
                      <Text style={styles.signalTextNegative}>{signal}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Next action */}
              <View style={styles.nextActionBox}>
                <Text style={styles.nextActionLabel}>SUGGESTED NEXT ACTION</Text>
                <Text style={styles.nextActionText}>{summary.next_action}</Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.saveButton, shadows.fab]}
                  onPress={handleSave}
                  
                >
                  <Text style={styles.saveButtonText}>Save & Update Lead</Text>
                </Pressable>
                <Pressable
                  style={styles.editButton}
                  onPress={handleEditNotes}
                  
                >
                  <Text style={styles.editButtonText}>Edit Notes</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tempBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  tempLabel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tempMeta: {
    gap: 4,
  },
  confidenceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  durationLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  signalIconPositive: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
    marginTop: 1,
  },
  signalIconNegative: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '700',
    marginTop: 1,
  },
  signalTextPositive: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  signalTextNegative: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  nextActionBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0D898',
    gap: 6,
  },
  nextActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  nextActionText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  buttonRow: {
    gap: 10,
    paddingTop: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
  editButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
})
