import { useState } from 'react';
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

import { useChatStore } from './chatStore';

const EXAMPLES = [
  'How does RAG work?',
  'What is cosine similarity?',
  'What is a transformer model?',
];

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Ask the knowledge base</Text>
      <Text style={styles.emptySubtitle}>
        Answers are grounded in retrieved documents and cited back to the source.
      </Text>
      <View style={styles.exampleList}>
        {EXAMPLES.map((q) => (
          <Pressable key={q} style={styles.exampleChip} onPress={() => onPick(q)}>
            <Text style={styles.exampleText}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ChatScreen() {
  const messages = useChatStore((s) => s.messages);
  const ask = useChatStore((s) => s.ask);
  const [text, setText] = useState('');

  const submit = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setText('');
    void ask(q);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyContainer : { padding: 12 }
        }
        data={messages}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<EmptyState onPick={submit} />}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View
              style={[
                styles.bubble,
                { alignSelf: isUser ? 'flex-end' : 'flex-start', backgroundColor: isUser ? '#ddd6fe' : '#f1f5f9' },
              ]}>
              <Text style={styles.bubbleText}>{item.content || '...'}</Text>
              {item.citations.length > 0 && (
                <View style={styles.citations}>
                  {item.citations.map((c, i) => (
                    <View key={i} style={styles.citationChip}>
                      <Text style={styles.citationText}>
                        {i + 1} · {c.chunk.sourceId}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ask..."
          onSubmitEditing={() => submit(text)}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={() => submit(text)}>
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 12, borderRadius: 12, marginVertical: 4, maxWidth: '80%' },
  bubbleText: { fontSize: 15, lineHeight: 21, color: '#0f172a' },
  citations: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 },
  citationChip: { backgroundColor: '#7c3aed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  citationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  empty: { alignItems: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  exampleList: { gap: 10, alignSelf: 'stretch' },
  exampleChip: {
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  exampleText: { color: '#5b21b6', fontSize: 15, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { marginLeft: 8, backgroundColor: '#7c3aed', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
