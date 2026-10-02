import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DayStepper, Field, FormSheet, Input, MoneyInput, SwatchPicker } from '@/components/form';
import { useStore } from '@/store';
import { SWATCHES } from '@/theme';

export default function CardFormScreen() {
  const addCard = useStore((s) => s.addCard);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState(0);
  const [closingDay, setClosingDay] = useState(3);
  const [dueDay, setDueDay] = useState(10);
  const [color, setColor] = useState(SWATCHES[0]);

  return (
    <FormSheet
      title="Novo cartão"
      canSave={name.trim().length > 0 && limit > 0}
      onSave={() => {
        addCard({ name: name.trim(), limit, closingDay, dueDay, color });
        router.back();
      }}
    >
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder="Ex.: Nubank" autoFocus />
      </Field>
      <Field label="Limite total">
        <MoneyInput cents={limit} onChange={setLimit} />
      </Field>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Fecha">
            <DayStepper value={closingDay} onChange={setClosingDay} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Vence">
            <DayStepper value={dueDay} onChange={setDueDay} />
          </Field>
        </View>
      </View>
      <Field
        label="Cor"
        hint="Compras feitas depois do fechamento entram na fatura seguinte — é assim que a previsão sabe em que mês cada compra pesa."
      >
        <SwatchPicker value={color} onChange={setColor} />
      </Field>
    </FormSheet>
  );
}
