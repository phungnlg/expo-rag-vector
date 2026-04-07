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

export function ChatScreen() {
  const messages = useChatStore((s) => s.messages);
  const ask = useChatStore((s) => s.ask);
  const [text, setText] = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View
              style={[
                styles.bubble,
                { alignSelf: isUser ? 'flex-end' : 'flex-start', backgroundColor: isUser ? '#ddd6fe' : '#f1f5f9' },
              ]}>
              <Text>{item.content}</Text>
              {item.citations.length > 0 && (
                <View style={styles.citations}>
                  {item.citations.map((_, i) => (
                    <View key={i} style={styles.citationChip}>
                      <Text style={styles.citationText}>cite {i + 1}</Text>
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
        />
        <Pressable
          style={styles.sendBtn}
          onPress={() => {
            if (!text.trim()) return;
            const q = text.trim();
            setText('');
            void ask(q);
          }}>
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 12, borderRadius: 12, marginVertical: 4, maxWidth: '80%' },
  citations: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 },
  citationChip: { backgroundColor: '#7c3aed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  citationText: { color: '#fff', fontSize: 11 },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12 },
  sendBtn: { marginLeft: 8, backgroundColor: '#7c3aed', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
