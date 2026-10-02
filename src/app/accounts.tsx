import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, Money, styles } from '@/components/ui';
import { accountBalance, balance } from '@/finance/engine';
import type { Account } from '@/finance/types';
import { useFinanceData, useStore } from '@/store';
import { colors, gutter } from '@/theme';

export default function AccountsScreen() {
  const data = useFinanceData();
  const deleteAccount = useStore((s) => s.deleteAccount);

  const confirmDelete = (account: Account) => {
    if (Platform.OS === 'web') return deleteAccount(account.id);
    Alert.alert(`Excluir ${account.name}?`, 'Os lançamentos continuam salvos, mas deixam de estar ligados a esta conta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteAccount(account.id) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: gutter, gap: 12 }}>
      <Card>
        <View style={styles.row}>
          <Text style={styles.secondary}>Total</Text>
          <Money cents={balance(data)} />
        </View>
      </Card>

      <Card padding={8}>
        {data.accounts.map((account) => (
          <Pressable
            key={account.id}
            onLongPress={() => confirmDelete(account)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: account.color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{account.name.charAt(0)}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500', flex: 1 }}>{account.name}</Text>
            <Money cents={accountBalance(data, account)} size={16} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => router.push('/account-form')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}
        >
          <Ionicons name="add-circle" size={22} color={colors.lime} />
          <Text style={{ color: colors.lime, fontSize: 16, fontWeight: '600' }}>Adicionar conta</Text>
        </Pressable>
      </Card>

      {data.accounts.length > 0 && (
        <Text style={[styles.tertiary, { textAlign: 'center' }]}>Segure uma conta para excluir</Text>
      )}
    </ScrollView>
  );
}
