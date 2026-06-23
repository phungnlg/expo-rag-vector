import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryContainer },
        headerTintColor: colors.onPrimaryContainer,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 22 },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'RAG Assistant',
          headerRight: () => (
            <View style={{ paddingRight: 4 }}>
              <MaterialIcons name="sensors" size={24} color={colors.onPrimaryContainer} />
            </View>
          ),
        }}
      />
    </Stack>
  );
}
