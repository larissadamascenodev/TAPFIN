import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui';
import type { IconName } from '@/finance/categories';
import { colors, gutter } from '@/theme';

/** Endereço que abre o lançamento rápido de qualquer lugar do iPhone. */
export const QUICK_ADD_URL = 'tapfin://quick-add';

const STEPS: { icon: IconName; text: string }[] = [
  { icon: 'layers', text: 'Abra o app Atalhos e crie um atalho novo chamado "Lançar no TapFin".' },
  { icon: 'link', text: `Adicione a ação "Abrir URLs" com o endereço ${QUICK_ADD_URL}` },
  { icon: 'settings', text: 'Vá em Ajustes → Acessibilidade → Toque → Tocar Atrás → Toque Duplo.' },
  { icon: 'checkmark-circle', text: 'Escolha o atalho "Lançar no TapFin". Pronto: dois toques nas costas do iPhone e você já está lançando.' },
];

/** Passo a passo para ligar o "Tocar Atrás" do iPhone ao TapFin. */
export default function BackTapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom + 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: gutter, paddingTop: 18 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.lime, fontSize: 16, fontWeight: '600' }}>OK</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 22 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
          Dois toques nas costas do iPhone e você já está lançando.
        </Text>
        {STEPS.map((step, index) => (
          <View key={step.text} style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.lime,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={step.icon} size={17} color="#000" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Passo {index + 1}</Text>
              <Text selectable style={{ color: colors.text, fontSize: 16, lineHeight: 22 }}>
                {step.text}
              </Text>
            </View>
          </View>
        ))}
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          Quer usar NFC? No app Atalhos, crie uma Automação → NFC, escaneie uma etiqueta e escolha o mesmo atalho. Cole
          a etiqueta na carteira ou na mesa.
        </Text>
      </ScrollView>
      <PrimaryButton
        title="Abrir o app Atalhos"
        onPress={() => Linking.openURL('shortcuts://')}
        style={{ marginHorizontal: gutter }}
      />
    </View>
  );
}
