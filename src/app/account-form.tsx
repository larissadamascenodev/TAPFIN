import { router } from 'expo-router';
import { useState } from 'react';

import { Field, FormSheet, Input, MoneyInput, SwatchPicker } from '@/components/form';
import { useStore } from '@/store';
import { SWATCHES } from '@/theme';

export default function AccountFormScreen() {
  const addAccount = useStore((s) => s.addAccount);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(0);
  const [color, setColor] = useState(SWATCHES[0]);

  return (
    <FormSheet
      title="Nova conta"
      canSave={name.trim().length > 0}
      onSave={() => {
        addAccount({ name: name.trim(), openingBalance: balance, color });
        router.back();
      }}
    >
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder="Ex.: Nubank, Carteira" autoFocus />
      </Field>
      <Field
        label="Saldo atual"
        hint="Por enquanto o saldo é informado por você. A conexão automática com bancos (Open Finance) vem numa próxima etapa."
      >
        <MoneyInput cents={balance} onChange={setBalance} />
      </Field>
      <Field label="Cor">
        <SwatchPicker value={color} onChange={setColor} />
      </Field>
    </FormSheet>
  );
}
