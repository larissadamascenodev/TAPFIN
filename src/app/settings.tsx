import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, Input } from '@/components/form';
import type { IconName } from '@/finance/categories';
import { useStore } from '@/store';
import { colors, gutter } from '@/theme';

// TODO: trocar pelas URLs reais antes de enviar para a App Store.
const PRIVACY_URL = 'https://tapfin.app/privacidade';
const TERMS_URL = 'https://tapfin.app/termos';
const SUPPORT_URL = 'mailto:suporte@tapfin.app';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const userName = useStore((s) => s.userName);
  const setUserName = useStore((s) => s.setUserName);
  const hideValues = useStore((s) => s.hideValues);
  const toggleHideValues = useStore((s) => s.toggleHideValues);
  const loadSample = useStore((s) => s.loadSample);
  const resetAll = useStore((s) => s.resetAll);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const confirmReset = () => {
    const reset = () => {
      resetAll();
    };
    if (Platform.OS === 'web') return reset();
    Alert.alert('Apagar tudo?', 'Contas, cartões e lançamentos serão apagados deste aparelho. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar todos os dados', style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingTop: 18, paddingBottom: 8 }}>
        <View style={{ width: 60 }} />
        <Text style={{ flex: 1, textAlign: 'center', color: colors.text, fontSize: 17, fontWeight: '600' }}>Ajustes</Text>
        <Pressable onPress={() => router.back()} style={{ width: 60, alignItems: 'flex-end' }}>
          <Text style={{ color: colors.lime, fontSize: 16, fontWeight: '600' }}>OK</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: gutter, gap: 22, paddingBottom: insets.bottom + 24 }}>
        <Field label="Seu nome">
          <Input value={userName} onChangeText={setUserName} placeholder="Como podemos te chamar?" />
        </Field>

        <Group>
          <Row icon="eye-off-outline" title="Ocultar valores">
            <Switch
              value={hideValues}
              onValueChange={toggleHideValues}
              trackColor={{ true: colors.lime, false: 'rgba(255,255,255,0.2)' }}
              thumbColor="#fff"
            />
          </Row>
        </Group>

        <Field label="Lançamento rápido" hint='Também funciona com a Siri ("E aí Siri, TapFin"), o Botão de Ação e etiquetas NFC.'>
          <Group>
            <Row icon="phone-portrait-outline" title="Lançar com dois toques nas costas" onPress={() => router.push('/back-tap')} />
          </Group>
        </Field>

        <Field label="Dados">
          <Group>
            <Row
              icon="flask-outline"
              title="Carregar dados de exemplo"
              onPress={() => {
                loadSample();
                router.back();
              }}
            />
            <Row icon="trash-outline" title="Apagar todos os meus dados" destructive onPress={confirmReset} />
          </Group>
        </Field>

        <Field label="Sobre" hint={`TapFin ${version} · Seus dados ficam só no seu celular.`}>
          <Group>
            <Row icon="shield-checkmark-outline" title="Política de privacidade" onPress={() => Linking.openURL(PRIVACY_URL)} />
            <Row icon="document-text-outline" title="Termos de uso" onPress={() => Linking.openURL(TERMS_URL)} />
            <Row icon="mail-outline" title="Fale com a gente" onPress={() => Linking.openURL(SUPPORT_URL)} />
          </Group>
        </Field>
      </ScrollView>
    </View>
  );
}

function Group({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 18,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardStroke,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

function Row({
  icon,
  title,
  onPress,
  destructive,
  children,
}: {
  icon: IconName;
  title: string;
  onPress?: () => void;
  destructive?: boolean;
  children?: ReactNode;
}) {
  const color = destructive ? colors.expense : colors.text;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: children ? 10 : 15,
        backgroundColor: pressed ? colors.elevated : 'transparent',
      })}
    >
      <Ionicons name={icon} size={20} color={destructive ? colors.expense : colors.textSecondary} />
      <Text style={{ color, fontSize: 16, flex: 1 }}>{title}</Text>
      {children ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null)}
    </Pressable>
  );
}
