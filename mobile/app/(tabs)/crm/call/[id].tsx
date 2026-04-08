import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, Pressable, StyleSheet,
  SafeAreaView, StatusBar, Alert, Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { haptic } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { colors, radius, shadows } from '@/theme/colors'
import { CallSummarySheet, CallSummaryData } from '@/components/crm/CallSummarySheet'

type CallState = 'calling' | 'connected' | 'ended'

const MOCK_SUMMARY: CallSummaryData = {
  temperature: 'HOT',
  confidence: 91,
  summary:
    'Lead confirmed strong interest in 3BHK at Greenview Apartments. Budget confirmed at ₹85L. Wants site visit Saturday before 11am. Parking was raised as a concern.',
  signals: {
    positive: [
      'Asked about possession date',
      'Requested specific visit date',
      'Mentioned bringing family',
    ],
    negative: ['Concerned about parking availability'],
  },
  next_action:
    'Book site visit for Saturday 10am. Confirm parking availability with property team first.',
  duration_seconds: 165,
}

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [leadName, setLeadName] = useState('Loading...')
  const [leadPhone, setLeadPhone] = useState('')
  const [callState, setCallState] = useState<CallState>('calling')
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(false)
  const [showKeypad, setShowKeypad] = useState(false)

  // Post-call
  const [summaryVisible, setSummaryVisible] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState<CallSummaryData | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch lead details
  useEffect(() => {
    if (!id) return
    supabase
      .from('leads')
      .select('name, phone')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setLeadName(data.name ?? 'Unknown')
          setLeadPhone(data.phone ?? '')
        }
      })
  }, [id])

  // Simulate call connecting after 2 seconds
  useEffect(() => {
    connectedTimeoutRef.current = setTimeout(() => {
      setCallState('connected')
      startTimer()
    }, 2000)

    return () => {
      if (connectedTimeoutRef.current) clearTimeout(connectedTimeoutRef.current)
    }
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function handleEndCall() {
    haptic.heavy()
    stopTimer()
    setCallState('ended')
    setSummaryVisible(true)
    setSummaryLoading(true)

    // Simulate AI processing for 3 seconds
    setTimeout(() => {
      setSummaryLoading(false)
      setSummary({ ...MOCK_SUMMARY, duration_seconds: elapsed > 0 ? elapsed : 165 })
    }, 3000)
  }

  function handleMute() {
    haptic.light()
    setMuted(prev => !prev)
  }

  function handleSpeaker() {
    haptic.light()
    setSpeakerOn(prev => !prev)
  }

  function handleKeypad() {
    haptic.light()
    setShowKeypad(prev => !prev)
  }

  async function handleSaveSummary(data: CallSummaryData) {
    if (!id) return
    haptic.light()
    try {
      await supabase.from('leads').update({
        priority: data.temperature.toLowerCase() as 'hot' | 'warm' | 'cold',
        last_called_at: new Date().toISOString(),
      }).eq('id', id)

      await supabase.from('call_logs').insert({
        lead_id: id,
        duration_seconds: data.duration_seconds,
        summary: data.summary,
        temperature: data.temperature,
        confidence: data.confidence,
        signals_positive: data.signals.positive,
        signals_negative: data.signals.negative,
        next_action: data.next_action,
        called_at: new Date().toISOString(),
      })
    } catch {
      // Graceful failure — call log is non-critical
    }

    setSummaryVisible(false)
    router.back()
  }

  function handleCloseSummary() {
    setSummaryVisible(false)
    router.back()
  }

  const getInitial = useCallback((name: string) => {
    return name.charAt(0).toUpperCase()
  }, [])

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.textPrimary} />
      <SafeAreaView style={styles.safe}>

        {/* Top indicators */}
        <View style={styles.topBar}>
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recLabel}>REC</Text>
          </View>
          <View style={styles.aiIndicator}>
            <Text style={styles.aiLabel}>AI Listening...</Text>
          </View>
        </View>

        {/* Center: Avatar + Name + Status */}
        <View style={styles.center}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{getInitial(leadName)}</Text>
          </View>

          <Text style={styles.leadName}>{leadName}</Text>
          {leadPhone ? <Text style={styles.leadPhone}>{leadPhone}</Text> : null}

          <View style={styles.statusRow}>
            {callState === 'calling' ? (
              <Text style={styles.statusCalling}>Calling...</Text>
            ) : callState === 'connected' ? (
              <View style={styles.connectedRow}>
                <View style={styles.activeDot} />
                <Text style={styles.statusConnected}>Connected — {formatTime(elapsed)}</Text>
              </View>
            ) : (
              <Text style={styles.statusEnded}>Call Ended</Text>
            )}
          </View>
        </View>

        {/* Call Controls */}
        {callState !== 'ended' && (
          <View style={styles.controls}>
            {/* Secondary controls */}
            <View style={styles.secondaryControls}>
              <ControlButton
                icon={muted ? '🔇' : '🎤'}
                label={muted ? 'Unmute' : 'Mute'}
                onPress={handleMute}
                active={muted}
              />
              <ControlButton
                icon={speakerOn ? '🔊' : '🔈'}
                label="Speaker"
                onPress={handleSpeaker}
                active={speakerOn}
              />
              <ControlButton
                icon="⌨️"
                label="Keypad"
                onPress={handleKeypad}
                active={showKeypad}
              />
            </View>

            {/* Keypad (simple display) */}
            {showKeypad && (
              <View style={styles.keypad}>
                {['1','2','3','4','5','6','7','8','9','*','0','#'].map(key => (
                  <Pressable
                    key={key}
                    style={styles.keypadBtn}
                    onPress={() => haptic.light()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keypadBtnText}>{key}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* End call button */}
            <Pressable
              style={[styles.endCallButton, shadows.fab]}
              onPress={handleEndCall}
              
            >
              <Text style={styles.endCallIcon}>📵</Text>
            </Pressable>
          </View>
        )}

      </SafeAreaView>

      {/* Post-call summary sheet */}
      <CallSummarySheet
        visible={summaryVisible}
        onClose={handleCloseSummary}
        onSave={handleSaveSummary}
        leadName={leadName}
        summary={summary}
        loading={summaryLoading}
      />
    </View>
  )
}

function ControlButton({
  icon, label, onPress, active,
}: {
  icon: string
  label: string
  onPress: () => void
  active?: boolean
}) {
  return (
    <Pressable style={styles.controlBtn} onPress={onPress} >
      <View style={[styles.controlBtnInner, active && styles.controlBtnActive]}>
        <Text style={styles.controlBtnIcon}>{icon}</Text>
      </View>
      <Text style={styles.controlBtnLabel}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220,38,38,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
  },
  recLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  aiIndicator: {
    backgroundColor: 'rgba(201,147,10,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(201,147,10,0.5)',
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leadName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  leadPhone: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  statusRow: {
    marginTop: 4,
  },
  statusCalling: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  statusConnected: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusEnded: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
  },
  controlBtnInner: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(201,147,10,0.3)',
  },
  controlBtnIcon: {
    fontSize: 22,
  },
  controlBtnLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: 260,
  },
  keypadBtn: {
    width: 64,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallIcon: {
    fontSize: 28,
  },
})

