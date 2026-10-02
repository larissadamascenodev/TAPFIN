import { Tabs } from 'expo-router/js-tabs';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="entries" options={{ title: 'Lançamentos' }} />
      <Tabs.Screen name="xray" options={{ title: 'Raio-X' }} />
      <Tabs.Screen name="fin" options={{ title: 'Fin' }} />
    </Tabs>
  );
}
