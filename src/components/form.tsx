import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatBRL, parseBRL } from '@/finance/money';
import { colors, gutter, haptic, SWATCHES } from '@/theme';

import { PrimaryButton } from './ui';

/** Moldura de formulário em modal: título, cancelar e botão salvar fixo embaixo. */
export function FormSheet({
  title,
  children,
  saveTitle = 'Salvar',
  canSave,
  onSave,
}: {
  title: string;
  children: ReactNode;
  saveTitle?: string;
  canSave: boolean;
  onSave: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom + 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingTop: 18, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ width: 80 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancelar</Text>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', color: colors.text, fontSize: 17, fontWeight: '600' }}>{title}</Text>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 18 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      <PrimaryButton
        title={saveTitle}
        disabled={!canSave}
        onPress={() => {
          haptic.success();
          onSave();
        }}
        style={{ marginHorizontal: gutter }}
      />
    </View>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>{label}</Text>
      {children}
      {hint && <Text style={{ color: colors.textTertiary, fontSize: 12, lineHeight: 17 }}>{hint}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      {...props}
      style={[
        {
          color: colors.text,
          fontSize: 17,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardStroke,
        },
        props.style,
      ]}
    />
  );
}

/** Campo de valor em reais: digita como em app de banco. */
export function MoneyInput({
  cents,
  onChange,
  placeholder = 'R$ 0,00',
}: {
  cents: number;
  onChange: (cents: number) => void;
  placeholder?: string;
}) {
  return (
    <Input
      value={cents > 0 ? formatBRL(cents) : ''}
      onChangeText={(text) => onChange(parseBRL(text))}
      placeholder={placeholder}
      keyboardType="number-pad"
    />
  );
}

export function SwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {SWATCHES.map((color) => (
        <Pressable
          key={color}
          accessibilityLabel={`Cor ${color}`}
          onPress={() => {
            haptic.selection();
            onChange(color);
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: color,
            borderWidth: value === color ? 3 : 0,
            borderColor: '#fff',
          }}
        />
      ))}
    </View>
  );
}

/** Seletor de dia do mês (1 a 28) com setas. */
export function DayStepper({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  const step = (delta: number) => {
    haptic.selection();
    onChange(((value - 1 + delta + 28) % 28) + 1);
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardStroke,
      }}
    >
      <Pressable onPress={() => step(-1)} style={{ padding: 14 }} accessibilityLabel="Dia anterior">
        <Ionicons name="remove" size={20} color={colors.text} />
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>Dia {value}</Text>
      <Pressable onPress={() => step(1)} style={{ padding: 14 }} accessibilityLabel="Próximo dia">
        <Ionicons name="add" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}
