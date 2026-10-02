import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useStore } from '@/store';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Se o app abrir direto num modal (ex.: tapfin://quick-add pelo Toque nas Costas),
// as abas ficam por baixo dele.
export const unstable_settings = {
  anchor: '(tabs)',
};

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.lime,
    background: colors.background,
    card: colors.background,
    border: colors.cardStroke,
  },
};

const modal = { presentation: 'modal' as const };
const pushed = { headerShown: true, headerTransparent: false, headerTintColor: colors.lime, headerTitleStyle: { color: colors.text } };

export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated);
  const signedIn = useStore((s) => s.userName.length > 0);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  // Espera os dados salvos carregarem antes de decidir entre onboarding e app.
  if (!hydrated) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quick-add" options={modal} />
          <Stack.Screen name="settings" options={modal} />
          <Stack.Screen name="back-tap" options={modal} />
          <Stack.Screen name="account-form" options={modal} />
          <Stack.Screen name="card-form" options={modal} />
          <Stack.Screen name="accounts" options={{ ...pushed, title: 'Contas', headerBackTitle: 'Início' }} />
          <Stack.Screen name="card/[id]" options={{ ...pushed, title: '', headerBackTitle: 'Início' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
