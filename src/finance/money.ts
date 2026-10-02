/** Formata centavos como real: 123456 → "R$ 1.234,56". */
export function formatBRL(cents: number, options: { signed?: boolean } = {}): string {
  const abs = Math.abs(Math.round(cents));
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = String(abs % 100).padStart(2, '0');
  const text = `R$ ${reais},${centavos}`;
  if (cents < 0) return `-${text}`;
  if (options.signed && cents > 0) return `+${text}`;
  return text;
}

/** Versão curta para gráficos: 152000 → "1,5k". */
export function formatCompact(cents: number): string {
  const reais = cents / 100;
  const sign = reais < 0 ? '-' : '';
  const abs = Math.abs(reais);
  if (abs >= 1000) {
    const value = abs / 1000;
    const text = value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace('.0', '');
    return `${sign}${text.replace('.', ',')}k`;
  }
  return `${sign}${Math.round(abs)}`;
}

/** Divide um total em parcelas; a última absorve o arredondamento. */
export function splitInstallments(total: number, count: number): number[] {
  const n = Math.max(1, Math.floor(count));
  const part = Math.round(total / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - part * (n - 1) : part));
}

/** Lê o valor como em app de banco: só os dígitos contam e os dois últimos são centavos. */
export function parseBRL(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}
