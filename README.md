# TapFin

**Dois toques. Seu mês inteiro sob controle.**

App iOS nativo (SwiftUI + SwiftData) de finanças pessoais: previsão do que vai sobrar no mês e nos próximos, controle de faturas e limite em tempo real, lançamento em dois toques (na tela ou nas costas do iPhone), Raio-X financeiro e o assistente **Fin**.

## Como abrir

1. Mac com **Xcode 16 ou mais novo**.
2. Abra `TapFin.xcodeproj`.
3. Em *Signing & Capabilities*, escolha seu **Team** e ajuste o **Bundle Identifier** (hoje `com.tapfin.app`).
4. Rode no simulador ou no iPhone (iOS 18+).
5. Para ver o app cheio: avatar (canto superior esquerdo) → **Carregar dados de exemplo**.

O projeto usa pastas sincronizadas do Xcode 16: qualquer arquivo novo dentro de `TapFin/` entra no build automaticamente, sem mexer no `.xcodeproj`.

## O que já tem

| Tela | O que faz |
|---|---|
| **Início → Contas** | Quanto vai sobrar no mês (com agendados, parcelas e faturas), saldo, faturas, gastos por categoria, recentes, fixos/assinaturas, parcelamentos e mini-previsão dos próximos 6 meses. O gradiente do topo muda de cor conforme a saúde do mês. |
| **Início → Cartões** | Fatura aberta, vencimento, limite usado/disponível; detalhe com as próximas 6 faturas. Compras após o fechamento caem na fatura seguinte. |
| **Início → Previsão** | Sobra por mês e saldo projetado (3, 6 ou 12 meses). |
| **+ (Lançamento rápido)** | Teclado próprio, categoria/conta sugeridas, parcelado no cartão, recorrente, agendado. |
| **Lançamentos** | Lista por mês, busca, filtro, excluir (exclui a compra parcelada inteira). |
| **Raio-X** | Nota de saúde financeira, alertas antes de apertar e simulador **"Posso comprar?"**. |
| **Fin** | Chat que responde com base nos seus dados (cálculo local por enquanto). |
| **Ajustes** | Nome, ocultar valores, guia do toque nas costas, apagar todos os dados, links legais. |

### Dois toques nas costas / NFC

O iOS não permite que apps detectem o *Back Tap* nem leiam NFC em segundo plano diretamente. O caminho oficial é via **App Intents/Atalhos**, que já estão no app:

- `Lançamento rápido` e `Nova receita` — abrem o app direto no lançamento.
- `Registrar gasto` — lança sem abrir o app (Siri/Atalhos/automação).

O usuário liga em *Ajustes → Acessibilidade → Toque → Tocar Atrás → Toque Duplo → Lançamento rápido* (há um passo a passo dentro do app). Para NFC: *Atalhos → Automação → NFC*. Também funciona com Siri e com o Botão de Ação.

Na tela, tocar duas vezes na saudação da Início também abre o lançamento.

## Estrutura

```
TapFin/
  App/            entrada do app, raiz, barra flutuante, roteador
  DesignSystem/   tema, componentes, gradiente vivo
  Models/         SwiftData: MoneyEntry (lançamento), Account, CreditCard, categorias
  Services/       FinanceEngine (previsão, faturas, saldo), XRayAnalyzer, FinAssistant, persistência
  Intents/        App Intents + App Shortcuts (Siri, Toque nas Costas, NFC)
  Features/       uma pasta por tela
  Resources/      Assets (ícone, cor), PrivacyInfo.xcprivacy
```

Toda a matemática fica em `Services/FinanceEngine.swift` (funções puras), reaproveitada por Início, Previsão, Raio-X e Fin.

## Checklist App Store

Já configurado:
- [x] Ícone 1024×1024 sem transparência (provisório — trocar pela marca final)
- [x] Launch screen, orientação retrato, modo escuro
- [x] `PrivacyInfo.xcprivacy` (sem rastreamento; motivo declarado para `UserDefaults`)
- [x] `ITSAppUsesNonExemptEncryption = NO` (sem pergunta de criptografia a cada envio)
- [x] Categoria Finanças, nome de exibição, versão 1.0.0 (1)
- [x] Opção de apagar todos os dados dentro do app
- [x] Dados só no aparelho (sem login, sem servidor)

Antes de enviar:
- [ ] Definir Team e Bundle ID definitivos; criar o app no App Store Connect
- [ ] Publicar **Política de Privacidade** e **Termos** e trocar as URLs em `Features/Settings/SettingsView.swift`
- [ ] Ícone final e screenshots (6.9" e 6.5")
- [ ] Preencher "Privacidade do app" no App Store Connect (hoje: nenhum dado coletado)
- [ ] Quando entrar login/conta: botão de **excluir conta** dentro do app (regra 5.1.1(v)) e **Entrar com Apple** se houver login social
- [ ] Quando entrar câmera (escanear comprovante): `NSCameraUsageDescription`
- [ ] Quando entrar assinatura (TapFin Pro): StoreKit 2 + tela de restaurar compras

## Próximos passos sugeridos

1. Escanear comprovante/nota (VisionKit + câmera) → lançamento preenchido.
2. Importar fatura (PDF/foto) e conciliar com os lançamentos do cartão.
3. Fin com IA de verdade via backend próprio (sem chave de API no app).
4. Widgets na tela de bloqueio e controle na Central de Controle.
5. Metas/planos ("viajar", "sair da dívida") com plano mensal.
6. Face ID para abrir o app; iCloud sync.
7. Open Finance para conectar bancos.
