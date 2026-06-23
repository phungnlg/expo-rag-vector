import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#7c3aed' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Stack.Screen name="index" options={{ title: 'RAG Assistant' }} />
    </Stack>
  );
}
