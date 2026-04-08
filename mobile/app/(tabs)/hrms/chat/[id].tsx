import { useState, useRef } from 'react'
import {
  View, Text, Pressable, FlatList, TextInput, SafeAreaView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, type as t } from '@/theme/colors'

interface ChatMessage {
  id: string
  text: string
  sent: boolean
  time: string
}

const SAMPLE_MESSAGES: ChatMessage[] = [
  { id: '1', text: 'Hi! Can you review the property listing for Plot 21?', sent: false, time: '10:02 AM' },
  { id: '2', text: 'Sure, I will take a look at it now.', sent: true, time: '10:03 AM' },
  { id: '3', text: 'The photos look good but we need to update the pricing section.', sent: false, time: '10:05 AM' },
  { id: '4', text: 'I noticed the square footage is also wrong. Let me fix both.', sent: true, time: '10:06 AM' },
  { id: '5', text: 'Perfect, thanks! Also the client wants a site visit tomorrow at 11 AM.', sent: false, time: '10:08 AM' },
  { id: '6', text: 'I will be there. Should I bring the updated brochures?', sent: true, time: '10:09 AM' },
  { id: '7', text: 'Yes please, and the floor plans too.', sent: false, time: '10:10 AM' },
  { id: '8', text: 'Got it. I will prepare everything today.', sent: true, time: '10:11 AM' },
]

export default function ChatDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES)
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [newMsg, ...prev])
    setInput('')
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[s.bubbleRow, item.sent ? s.bubbleRowRight : s.bubbleRowLeft]}>
      <View style={[s.bubble, item.sent ? s.bubbleSent : s.bubbleReceived]}>
        <Text style={[s.bubbleText, item.sent ? s.bubbleTextSent : s.bubbleTextReceived]}>
          {item.text}
        </Text>
      </View>
      <Text style={[s.time, item.sent ? s.timeRight : s.timeLeft]}>{item.time}</Text>
    </View>
  )

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{name || 'Chat'}</Text>
        <Pressable style={s.optionsBtn} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={s.inputBar}>
          <Pressable style={s.iconBtn} hitSlop={6}>
            <Ionicons name="attach" size={22} color={colors.textMuted} />
          </Pressable>
          <Pressable style={s.iconBtn} hitSlop={6}>
            <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
          </Pressable>
          <TextInput
            style={s.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={({ pressed }) => [s.sendBtn, pressed && { opacity: 0.8 }]}
            onPress={sendMessage}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginHorizontal: 12 },
  optionsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },

  listContent: { paddingHorizontal: 16, paddingVertical: 12 },

  bubbleRow: { marginBottom: 12 },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubbleRowRight: { alignItems: 'flex-end' },

  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  bubbleReceived: {
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubbleSent: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextReceived: { color: colors.textPrimary },
  bubbleTextSent: { color: '#FFFFFF' },

  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, marginHorizontal: 4 },
  timeLeft: { alignSelf: 'flex-start' },
  timeRight: { alignSelf: 'flex-end' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  textInput: {
    flex: 1, minHeight: 36, maxHeight: 100,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 14, color: colors.textPrimary,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
})
