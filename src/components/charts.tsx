import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { shortMonthName } from '@/finance/dates';
import { formatCompact } from '@/finance/money';
import type { MonthKey } from '@/finance/types';
import { useStore } from '@/store';
import { colors } from '@/theme';

export interface MonthValue {
  month: MonthKey;
  value: number;
}

/** Barras por mês: positivo em verde-limão, negativo em vermelho. */
export function MonthBars({ data, height = 90 }: { data: MonthValue[]; height?: number }) {
  const hidden = useStore((s) => s.hideValues);
  const peak = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: height + 40 }}>
      {data.map((d) => {
        const negative = d.value < 0;
        return (
          <View key={d.month} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            {!hidden && (
              <Text
                numberOfLines={1}
                style={{ fontSize: 10, fontWeight: '600', color: negative ? colors.expense : colors.textSecondary }}
              >
                {formatCompact(d.value)}
              </Text>
            )}
            <View
              style={{
                width: '100%',
                height: Math.max(6, (height * Math.abs(d.value)) / peak),
                borderRadius: 7,
                backgroundColor: negative ? colors.expense : colors.lime,
              }}
            />
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{shortMonthName(d.month)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Barras lado a lado: cenário atual x cenário com a compra simulada. */
export function CompareBars({
  before,
  after,
  height = 110,
}: {
  before: MonthValue[];
  after: MonthValue[];
  height?: number;
}) {
  const peak = Math.max(1, ...before.map((d) => Math.abs(d.value)), ...after.map((d) => Math.abs(d.value)));
  const bar = (value: number, color: string) => (
    <View
      style={{
        flex: 1,
        height: Math.max(4, (height * Math.abs(value)) / peak),
        borderRadius: 5,
        backgroundColor: value < 0 ? colors.expense : color,
      }}
    />
  );
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: height + 22 }}>
        {before.map((d, i) => (
          <View key={d.month} style={{ flex: 1, gap: 6, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, width: '100%' }}>
              {bar(d.value, 'rgba(255,255,255,0.28)')}
              {bar(after[i]?.value ?? 0, colors.lime)}
            </View>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{shortMonthName(d.month)}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Legend color="rgba(255,255,255,0.28)" label="Hoje" />
        <Legend color={colors.lime} label="Com a compra" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

/** Linha suave com área: saldo projetado mês a mês. */
export function BalanceLine({ data, height = 150 }: { data: MonthValue[]; height?: number }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const values = data.map((d) => d.value);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const pad = 10;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / (max - min || 1));

  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const line = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');
  const area = points.length ? `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : '';
  const zeroY = y(0);

  return (
    <View>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="balance-area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.lime} stopOpacity={0.35} />
                <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {min < 0 && (
              <Path d={`M 0 ${zeroY} L ${width} ${zeroY}`} stroke={colors.expense} strokeDasharray="4 4" strokeWidth={1} />
            )}
            <Path d={area} fill="url(#balance-area)" />
            <Path d={line} stroke={colors.lime} strokeWidth={2.5} fill="none" />
            {points.map((p, i) => (
              <Circle
                key={data[i].month}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={colors.background}
                stroke={data[i].value < 0 ? colors.expense : colors.lime}
                strokeWidth={2}
              />
            ))}
          </Svg>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 6 }}>
        {data.map((d) => (
          <Text key={d.month} style={{ fontSize: 11, color: colors.textSecondary }}>
            {shortMonthName(d.month)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Anel de progresso (nota do Raio-X). */
export function Ring({ progress, color, size = 96, stroke = 10 }: { progress: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference * clamped} ${circumference}`}
      />
    </Svg>
  );
}
