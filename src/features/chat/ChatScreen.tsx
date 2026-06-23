import { MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, shadowFocused, shadowSoft, spacing } from '@/theme';
import type { RetrievedChunk } from '@/rag/vectorStore';
import { useChatStore, type ChatMessage } from './chatStore';

const EXAMPLES = [
  'How does RAG work?',
  'What is cosine similarity?',
  'What is a transformer model?',
];

const CHIP_ICONS = ['menu-book', 'description', 'article'] as const;

/** Render streamed answer text, coloring inline [cite:N] markers in primary. */
function AnswerText({ content }: { content: string }) {
  const parts = content.split(/(\[cite:\d+\])/g);
  return (
    <Text style={styles.aiText}>
      {parts.map((part, i) =>
        /^\[cite:\d+\]$/.test(part) ? (
          <Text key={i} style={styles.citeMarker}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function CitationChips({ citations }: { citations: RetrievedChunk[] }) {
  return (
    <View style={styles.sourcesBlock}>
      <Text style={styles.sourcesLabel}>SOURCES</Text>
      <View style={styles.chipRow}>
        {citations.map((c, i) => (
          <View key={i} style={styles.chip}>
            <MaterialIcons
              name={CHIP_ICONS[i % CHIP_ICONS.length]}
              size={15}
              color={colors.primary}
            />
            <Text style={styles.chipText}>
              {i + 1} · {c.chunk.sourceId}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ item }: { item: ChatMessage }) {
  const isUser = item.role === 'user';
  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.aiRow}>
      <View style={styles.aiBubble}>
        {item.content ? (
          <AnswerText content={item.content} />
        ) : (
          <Text style={styles.thinking}>Retrieving sources…</Text>
        )}
        {item.citations.length > 0 && <CitationChips citations={item.citations} />}
      </View>
    </View>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.heroCard}>
        <MaterialIcons name="auto-awesome" size={64} color={colors.primary} />
      </View>
      <Text style={styles.heroTitle}>Ask the knowledge base</Text>
      <Text style={styles.heroSubtitle}>
        Answers are grounded in retrieved documents and cited back to the source.
      </Text>
      <View style={styles.suggestList}>
        {EXAMPLES.map((q) => (
          <Pressable
            key={q}
            style={({ pressed }) => [styles.suggestChip, pressed && styles.suggestChipPressed]}
            onPress={() => onPick(q)}>
            <Text style={styles.suggestText}>{q}</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BottomNav() {
  const tabs = [
    { icon: 'chat-bubble', label: 'Chat', active: true },
    { icon: 'history', label: 'History', active: false },
    { icon: 'settings', label: 'Settings', active: false },
  ] as const;
  return (
    <View style={styles.nav}>
      {tabs.map((t) => (
        <View key={t.label} style={[styles.navItem, t.active && styles.navItemActive]}>
          <MaterialIcons
            name={t.icon}
            size={22}
            color={t.active ? colors.onPrimaryContainer : colors.onSurfaceVariant}
          />
          <Text style={[styles.navLabel, t.active && styles.navLabelActive]}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function ChatScreen() {
  const messages = useChatStore((s) => s.messages);
  const ask = useChatStore((s) => s.ask);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const submit = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setText('');
    void ask(q);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyContainer : styles.listContent
        }
        data={messages}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<EmptyState onPick={submit} />}
        renderItem={({ item }) => <MessageBubble item={item} />}
        onContentSizeChange={() =>
          messages.length > 0 && listRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputWrap}>
        <View style={[styles.inputBar, focused && styles.inputBarFocused]}>
          <MaterialIcons
            name="attach-file"
            size={22}
            color={colors.onSurfaceVariant}
            style={styles.attach}
          />
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Ask anything..."
            placeholderTextColor={colors.onSurfaceVariant}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => submit(text)}
            returnKeyType="send"
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
            onPress={() => submit(text)}>
            <MaterialIcons name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>

      <BottomNav />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.lg },

  // Empty state
  emptyContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingBottom: 40 },
  empty: { alignItems: 'center' },
  heroCard: {
    width: 128,
    height: 128,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadowSoft,
  },
  heroTitle: { fontSize: 30, fontWeight: '700', color: colors.onSurface, letterSpacing: -0.4, textAlign: 'center' },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  suggestList: { alignSelf: 'stretch', gap: 12 },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  suggestChipPressed: { borderColor: colors.primary, backgroundColor: colors.primary05 },
  suggestText: { fontSize: 17, fontWeight: '600', color: colors.onSurface },

  // Messages
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    borderBottomRightRadius: radii.sm,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: '85%',
    ...shadowSoft,
  },
  userText: { color: colors.onPrimary, fontSize: 16, lineHeight: 24 },

  aiRow: { alignItems: 'flex-start' },
  aiBubble: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    borderBottomLeftRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: '92%',
    ...shadowSoft,
  },
  aiText: { color: colors.onSurface, fontSize: 16, lineHeight: 26 },
  citeMarker: { color: colors.primary, fontWeight: '600' },
  thinking: { color: colors.onSurfaceVariant, fontSize: 16, fontStyle: 'italic' },

  // Citation chips
  sourcesBlock: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  sourcesLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, color: colors.onSurfaceVariant, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary20,
    backgroundColor: colors.primary05,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  // Input
  inputWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.background },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    ...shadowFocused,
  },
  inputBarFocused: { borderColor: colors.primary },
  attach: { marginRight: 6 },
  input: { flex: 1, fontSize: 16, color: colors.onSurface, paddingVertical: 8 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: { opacity: 0.85, transform: [{ scale: 0.95 }] },

  // Bottom nav
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: radii.lg, gap: 2 },
  navItemActive: { backgroundColor: colors.primaryContainer },
  navLabel: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
  navLabelActive: { color: colors.onPrimaryContainer },
});
