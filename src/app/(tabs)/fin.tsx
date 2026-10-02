import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { answer, SUGGESTIONS } from '@/finance/assistant';
import { useFinanceData, useStore } from '@/store';
import { colors, gutter, haptic } from '@/theme';

interface Message {
  id: string;
  role: 'user' | 'fin';
  text: string;
}

/** Conversa com o Fin. Hoje responde com cálculos locais; a IA de verdade entra via backend. */
export default function FinScreen() {
  const insets = useSafeAreaInsets();
  const data = useFinanceData();
  const userName = useStore((s) => s.userName);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const keyboardVisible = useKeyboardVisible();

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, thinking]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;
    haptic.light();
    setDraft('');
    setMessages((m) => [...m, { id: `${Date.now()}-u`, role: 'user', text: question }]);
    setThinking(true);
    const reply = answer(question, data);
    setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, { id: `${Date.now()}-f`, role: 'fin', text: reply }]);
    }, 650);
  };

  const intro = (
    <View style={{ gap: 10, paddingVertical: 20 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.lime,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="sparkles" size={26} color="#000" />
      </View>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>Oi, {userName}! Eu sou o Fin.</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 21 }}>
        Pergunte qualquer coisa sobre o seu dinheiro. Eu olho seus lançamentos, faturas e parcelas e te mostro o
        próximo passo.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, gap: 12, paddingBottom: 16 }}
        data={messages}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={intro}
        keyboardDismissMode="interactive"
        renderItem={({ item }) => (
          <View style={{ alignItems: item.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <View
              style={{
                maxWidth: '84%',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 22,
                backgroundColor: item.role === 'user' ? colors.lime : colors.card,
              }}
            >
              <Text style={{ color: item.role === 'user' ? '#000' : '#fff', fontSize: 16, lineHeight: 22 }}>{item.text}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          thinking ? (
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, backgroundColor: colors.card }}>
              <Text style={{ color: colors.textSecondary, fontSize: 20, letterSpacing: 2 }}>•••</Text>
            </View>
          ) : null
        }
      />

      {messages.length === 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }}
          style={{ flexGrow: 0, marginBottom: 8 }}
        >
          {SUGGESTIONS.map((s) => (
            <Chip key={s} label={s} selected={false} onPress={() => send(s)} />
          ))}
        </ScrollView>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginHorizontal: gutter,
          // A barra flutuante some com o teclado; sem teclado, o campo fica acima dela.
          marginBottom: keyboardVisible ? 10 : 92 + insets.bottom,
          paddingLeft: 18,
          paddingRight: 6,
          paddingVertical: 6,
          borderRadius: 28,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardStroke,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Pergunte ao Fin"
          placeholderTextColor={colors.textTertiary}
          onSubmitEditing={() => send(draft)}
          returnKeyType="send"
          style={{ flex: 1, color: colors.text, fontSize: 16, paddingVertical: 8 }}
        />
        <Pressable
          accessibilityLabel="Enviar"
          disabled={!draft.trim()}
          onPress={() => send(draft)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: draft.trim() ? colors.lime : colors.textTertiary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-up" size={20} color="#000" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
