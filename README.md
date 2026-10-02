# TapFin

**Dois toques. Seu mês inteiro sob controle.**

App de finanças pessoais em **Expo (React Native + TypeScript)**: previsão do que vai sobrar no mês e nos próximos, faturas e limite do cartão em tempo real, lançamento em dois toques, Raio-X financeiro e o assistente **Fin**. Roda no **Expo Go** para testar e vai para a App Store e a Play Store pelo EAS, sem precisar de Mac.

## Testar no iPhone com o Expo Go

1. Instale o **Expo Go** no iPhone (App Store).
2. No computador (Windows, Mac ou Linux), instale o **Node.js LTS** em [nodejs.org](https://nodejs.org).
3. No terminal:

   ```bash
   git clone https://github.com/larissadamascenodev/TAPFIN.git
   cd TAPFIN
   git checkout claude/elegant-ritchie-21wmvw
   npm install
   npx expo start
   ```

4. Abra a **Câmera** do iPhone e aponte para o QR code que aparece no terminal. O app abre no Expo Go.
   - O celular e o computador precisam estar **no mesmo Wi-Fi**. Se não conectar, use `npx expo start --tunnel`.
5. Para ver o app cheio: toque no seu avatar (canto superior esquerdo) → **Carregar dados de exemplo**.

Para ver no navegador: `npx expo start --web`.

## O que já tem

| Tela | O que faz |
|---|---|
| **Início → Contas** | Quanto vai sobrar no mês (já com agendados, parcelas e faturas), saldo, faturas, gastos por categoria, recentes, fixos/assinaturas, parcelamentos e os próximos 6 meses. O gradiente do topo muda de cor com a saúde do mês. |
| **Início → Cartões** | Fatura aberta, vencimento, limite usado/disponível; detalhe com as próximas 6 faturas. Compra depois do fechamento cai na fatura seguinte. |
| **Início → Previsão** | Sobra por mês e saldo projetado (3, 6 ou 12 meses). |
| **+ (Lançamento rápido)** | Teclado próprio, categoria e conta sugeridas, parcelado no cartão, "todo mês", agendamento. Tocar duas vezes na saudação da Início também abre. |
| **Lançamentos** | Lista por mês, busca e filtro. Segure para excluir (exclui a compra parcelada inteira). |
| **Raio-X** | Nota de saúde financeira, alertas antes de apertar e o simulador **"Posso comprar?"**. |
| **Fin** | Chat que responde com base nos seus dados (cálculo local por enquanto). |
| **Ajustes** | Nome, ocultar valores, guia do toque nas costas, dados de exemplo, apagar tudo, links legais. |

Os dados ficam só no aparelho (AsyncStorage). Valores são guardados em centavos para não ter erro de arredondamento.

### Dois toques nas costas / NFC

O app abre o lançamento rápido pelo endereço `tapfin://quick-add`. No iPhone: crie um atalho no app **Atalhos** com a ação "Abrir URLs" → `tapfin://quick-add` e ligue em *Ajustes → Acessibilidade → Toque → Tocar Atrás → Toque Duplo*. Para NFC, use *Atalhos → Automação → NFC* com o mesmo atalho. O passo a passo também está dentro do app (Ajustes).

> No Expo Go o endereço `tapfin://` ainda não existe — isso funciona no app instalado de verdade (build do EAS).

## Desenvolvimento

```bash
npm run typecheck   # TypeScript
npm test            # testes do motor financeiro (src/finance)
npm run lint        # ESLint
```

```
src/
  app/          telas (Expo Router: cada arquivo é uma rota)
    (tabs)/     Início, Lançamentos, Raio-X, Fin
  components/   UI, gráficos, gradiente vivo, barra flutuante, painéis da Início
  finance/      motor financeiro puro: previsão, faturas, saldo, Raio-X, Fin (com testes)
  store.ts      estado do app (zustand) salvo no aparelho
  theme.ts      cores, espaçamentos, vibrações
```

Para instalar bibliotecas, use sempre `npx expo install <pacote>` (escolhe a versão compatível com a SDK 57). O Expo Go só tem as bibliotecas nativas que já vêm nele; tudo aqui é compatível.

## Publicar nas lojas (EAS)

Requer conta Apple Developer (US$ 99/ano) e, para Android, Google Play Console.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

O build roda na nuvem da Expo — não precisa de Mac.

## Checklist App Store

Já configurado (`app.json`):
- [x] Bundle ID `com.tapfin.app` (troque se quiser), versão 1.0.0, build automático no EAS
- [x] Ícone 1024×1024 sem transparência (provisório) e splash escura
- [x] `ITSAppUsesNonExemptEncryption = false` (sem pergunta de criptografia a cada envio)
- [x] Privacy manifest (sem rastreamento; motivo declarado para `UserDefaults`)
- [x] Categoria Finanças, retrato, modo escuro
- [x] Opção de apagar todos os dados dentro do app
- [x] Sem login e sem servidor: nada sai do aparelho

Antes de enviar:
- [ ] Publicar **Política de Privacidade** e **Termos** e trocar as URLs em `src/app/settings.tsx`
- [ ] Ícone final e screenshots
- [ ] Preencher "Privacidade do app" no App Store Connect (hoje: nenhum dado coletado)
- [ ] Quando houver login: **excluir conta** dentro do app (regra 5.1.1(v)) e **Entrar com Apple** se houver login social
- [ ] Quando houver câmera (escanear comprovante): texto de permissão da câmera
- [ ] Quando houver assinatura (TapFin Pro): compras in-app e "restaurar compras"

## Próximos passos sugeridos

1. Escanear comprovante/nota (câmera) → lançamento preenchido.
2. Importar fatura (PDF/foto) e conciliar com os lançamentos do cartão.
3. Fin com IA de verdade via backend próprio (sem chave de API no app).
4. Metas/planos ("viajar", "sair da dívida") com plano mensal.
5. Face ID para abrir o app; backup na nuvem.
6. Open Finance para conectar bancos.
