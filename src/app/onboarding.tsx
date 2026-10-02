import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LivingGradient } from '@/components/LivingGradient';
import { PrimaryButton } from '@/components/ui';
import { useStore } from '@/store';
import { colors, haptic } from '@/theme';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const setUserName = useStore((s) => s.setUserName);
  const [name, setName] = useState('');
  const canStart = name.trim().length > 0;

  const start = () => {
    if (!canStart) return;
    haptic.success();
    // O Stack.Protected do layout raiz troca para o app sozinho quando o nome é salvo.
    setUserName(name);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LivingGradient height={720} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: insets.bottom + 24, gap: 18 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 3,
              borderColor: colors.lime,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.lime }} />
          </View>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800' }}>TapFin</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 38, fontWeight: '600', lineHeight: 44 }}>
          Dois toques.{'\n'}Seu mês inteiro sob controle.
        </Text>

        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 23 }}>
          Saiba hoje quanto vai sobrar no fim do mês — e nos próximos. Lance gastos num toque, acompanhe faturas e deixe o
          Raio-X avisar antes de apertar.
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Como podemos te chamar?"
          placeholderTextColor="rgba(255,255,255,0.45)"
          textContentType="givenName"
          autoComplete="given-name"
          returnKeyType="go"
          onSubmitEditing={start}
          style={{
            color: colors.text,
            fontSize: 17,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.12)',
            marginTop: 8,
          }}
        />

        <PrimaryButton title="Começar" onPress={start} disabled={!canStart} />
      </KeyboardAvoidingView>
    </View>
  );
}
