import Foundation

/// Respostas do Fin calculadas localmente a partir dos dados do usuário.
/// Próximo passo: trocar por um modelo de IA via backend próprio (nunca colocar chave de API no app).
enum FinAssistant {
    static let suggestions = [
        "Quanto vai sobrar este mês?",
        "Onde estou gastando mais?",
        "Como estão os próximos meses?",
        "Quanto pago de assinaturas?",
        "Como está meu cartão?"
    ]

    static func answer(_ question: String, entries: [MoneyEntry], accounts: [Account], cards: [CreditCard], now: Date = .now) -> String {
        let q = question.lowercased().folding(options: .diacriticInsensitive, locale: .brazil)

        guard !entries.isEmpty || !accounts.isEmpty else {
            return "Ainda não tenho dados seus. Toque no + e lance sua renda e seus gastos fixos — em menos de um minuto eu já consigo prever o seu mês."
        }

        if q.contains("sobra") || q.contains("sobrar") || q.contains("este mes") || q.contains("esse mes") {
            let month = FinanceEngine.summary(for: now, entries: entries)
            if month.net >= 0 {
                return "Em \(now.monthName) entram \(month.income.brl()) e saem \(month.expense.brl()). Devem sobrar \(month.net.brl()). 🎯"
            }
            return "Atenção: em \(now.monthName) os gastos previstos (\(month.expense.brl())) passam da renda (\(month.income.brl())). Faltam \(month.net.magnitude.brl()). Quer que eu mostre onde dá para cortar?"
        }

        if q.contains("gast") && (q.contains("mais") || q.contains("maior") || q.contains("onde")) {
            let top = FinanceEngine.spendingByCategory(month: now, entries: entries).prefix(3)
            guard !top.isEmpty else { return "Ainda não vi gastos em \(now.monthName)." }
            let lines = top.map { "• \($0.category.title): \($0.total.brl())" }.joined(separator: "\n")
            return "Seus maiores gastos em \(now.monthName):\n\(lines)"
        }

        if q.contains("proxim") || q.contains("previs") || q.contains("futuro") {
            let months = FinanceEngine.months(from: now, count: 4, entries: entries)
            let lines = months.map { "• \($0.month.monthName.capitalizedFirst): \($0.net.brl(signed: true))" }.joined(separator: "\n")
            return "Previsão do que sobra:\n\(lines)"
        }

        if q.contains("assinatura") {
            let subs = FinanceEngine.recurringExpenses(entries: entries).filter { $0.category == .subscriptions }
            guard !subs.isEmpty else { return "Não encontrei assinaturas. Lance como recorrente na categoria Assinaturas que eu acompanho." }
            let total = subs.reduce(Decimal(0)) { $0 + $1.amount }
            let names = subs.map(\.title).joined(separator: ", ")
            return "Você paga \(total.brl()) por mês em assinaturas (\(names)). Em um ano, isso dá \((total * 12).brl())."
        }

        if q.contains("cartao") || q.contains("fatura") || q.contains("limite") {
            guard !cards.isEmpty else { return "Você ainda não cadastrou cartões. Vá em Início → Cartões." }
            let lines = cards.map { card in
                let invoice = FinanceEngine.invoice(of: card, month: now, entries: entries)
                let used = FinanceEngine.usedLimit(of: card, entries: entries, now: now)
                return "• \(card.name): fatura de \(invoice.brl()), \((card.creditLimit - used).brl()) de limite livre"
            }.joined(separator: "\n")
            return lines
        }

        if q.contains("comprar") || q.contains("posso") || q.contains("simul") {
            return "Abra o Raio-X e use o simulador \"Posso comprar?\": eu mostro mês a mês quanto a compra tira do que ia sobrar."
        }

        if q.contains("saldo") || q.contains("conta") {
            let balance = FinanceEngine.balance(accounts: accounts, entries: entries, at: now)
            return "Seu saldo somado nas contas é \(balance.brl())."
        }

        return "Posso te dizer quanto vai sobrar, onde você mais gasta, como estão os próximos meses, suas assinaturas e seus cartões. O que quer saber?"
    }
}
