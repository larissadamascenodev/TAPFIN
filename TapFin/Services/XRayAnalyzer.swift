import SwiftUI

struct Insight: Identifiable {
    enum Level { case good, info, attention, alert }

    let id = UUID()
    let level: Level
    let symbol: String
    let title: String
    let message: String

    var tint: Color {
        switch level {
        case .good: Theme.income
        case .info: Theme.info
        case .attention: Theme.warning
        case .alert: Theme.expense
        }
    }
}

struct XRayReport {
    let score: Int
    let headline: String
    let insights: [Insight]
}

/// Raio-X financeiro: lê tudo que entrou e saiu e aponta o que merece atenção — antes de apertar.
enum XRayAnalyzer {
    static func analyze(entries: [MoneyEntry], accounts: [Account], cards: [CreditCard], now: Date = .now) -> XRayReport {
        let calendar = FinanceEngine.calendar
        let months = FinanceEngine.months(from: now, count: 6, entries: entries)
        guard !entries.isEmpty, let current = months.first else {
            return XRayReport(
                score: 0,
                headline: "Lance suas receitas e gastos para o Raio-X começar a trabalhar.",
                insights: []
            )
        }

        var insights: [Insight] = []
        var score = 70

        // 1. Quanto sobra neste mês.
        if current.net < 0 {
            score -= 25
            insights.append(Insight(
                level: .alert,
                symbol: "exclamationmark.triangle.fill",
                title: "\(now.monthName.capitalizedFirst) vai fechar no vermelho",
                message: "Faltam \(current.net.magnitude.brl()) para cobrir os gastos previstos. Vale adiar algo ou rever as categorias maiores."
            ))
        } else if current.income > 0 {
            let rate = (current.net / current.income).doubleValue
            if rate >= 0.2 {
                score += 15
                insights.append(Insight(
                    level: .good,
                    symbol: "checkmark.seal.fill",
                    title: "Você vai guardar \(Int(rate * 100))% da renda",
                    message: "Devem sobrar \(current.net.brl()) em \(now.monthName). Que tal mandar parte disso para um plano?"
                ))
            } else {
                score -= 5
                insights.append(Insight(
                    level: .attention,
                    symbol: "gauge.with.dots.needle.33percent",
                    title: "Mês apertado",
                    message: "Só \(Int(max(rate, 0) * 100))% da renda deve sobrar. O ideal é mirar em pelo menos 20%."
                ))
            }
        }

        // 2. Próximos meses negativos — o aviso antes do problema.
        if let firstNegative = months.dropFirst().first(where: { $0.net < 0 }) {
            score -= 10
            insights.append(Insight(
                level: .alert,
                symbol: "calendar.badge.exclamationmark",
                title: "\(firstNegative.month.monthName.capitalizedFirst) pede atenção",
                message: "A previsão mostra \(firstNegative.net.magnitude.brl()) faltando. Dá tempo de ajustar agora."
            ))
        }

        // 3. Categoria que mais pesa.
        let categories = FinanceEngine.spendingByCategory(month: now, entries: entries)
        let totalSpent = categories.reduce(Decimal(0)) { $0 + $1.total }
        if let top = categories.first, totalSpent > 0 {
            let share = Int((top.total / totalSpent).doubleValue * 100)
            insights.append(Insight(
                level: share > 45 ? .attention : .info,
                symbol: top.category.symbol,
                title: "\(top.category.title) é \(share)% dos gastos",
                message: "Foram \(top.total.brl()) em \(now.monthName). É onde um ajuste pequeno faz mais diferença."
            ))
        }

        // 4. Categorias que subiram em relação ao mês passado.
        let lastMonth = calendar.addingMonths(-1, to: now)
        let previous = Dictionary(uniqueKeysWithValues: FinanceEngine.spendingByCategory(month: lastMonth, entries: entries).map { ($0.category, $0.total) })
        if let jump = categories.first(where: { item in
            guard let before = previous[item.category], before > 0 else { return false }
            return item.total > before * Decimal(1.3) && item.total - before > 100
        }), let before = previous[jump.category] {
            score -= 5
            insights.append(Insight(
                level: .attention,
                symbol: "arrow.up.right",
                title: "\(jump.category.title) subiu",
                message: "Foi de \(before.brl()) para \(jump.total.brl()) em relação ao mês passado."
            ))
        }

        // 5. Assinaturas e contas fixas.
        let subscriptions = FinanceEngine.recurringExpenses(entries: entries).filter { $0.category == .subscriptions }
        if !subscriptions.isEmpty {
            let monthly = subscriptions.reduce(Decimal(0)) { $0 + $1.amount }
            insights.append(Insight(
                level: .info,
                symbol: "repeat",
                title: "\(subscriptions.count) assinatura\(subscriptions.count > 1 ? "s" : "") ativa\(subscriptions.count > 1 ? "s" : "")",
                message: "São \(monthly.brl()) por mês, \((monthly * 12).brl()) por ano. Ainda usa todas?"
            ))
        }

        // 6. Uso de limite dos cartões.
        for card in cards where card.creditLimit > 0 {
            let used = FinanceEngine.usedLimit(of: card, entries: entries, now: now)
            let ratio = (used / card.creditLimit).doubleValue
            if ratio >= 0.8 {
                score -= 10
                insights.append(Insight(
                    level: .alert,
                    symbol: "creditcard.trianglebadge.exclamationmark",
                    title: "\(card.name) com \(Int(ratio * 100))% do limite usado",
                    message: "Restam \((card.creditLimit - used).brl()). Parcelamentos novos vão apertar as próximas faturas."
                ))
            }
        }

        // 7. Parcelas comprometendo meses futuros.
        let installments = FinanceEngine.remainingInstallments(entries: entries, now: now)
        if !installments.isEmpty {
            let total = installments.reduce(Decimal(0)) { $0 + $1.amount }
            let groups = Set(installments.compactMap(\.groupID)).count
            insights.append(Insight(
                level: .info,
                symbol: "square.stack.3d.up.fill",
                title: "\(groups) compra\(groups > 1 ? "s" : "") parcelada\(groups > 1 ? "s" : "")",
                message: "Ainda faltam \(total.brl()) em parcelas nos próximos meses."
            ))
        }

        let clamped = min(max(score, 5), 100)
        let headline: String
        switch clamped {
        case 80...: headline = "Suas finanças estão saudáveis. Bora fazer o dinheiro trabalhar pelos seus planos."
        case 55..<80: headline = "Tudo sob controle, com alguns pontos de atenção."
        default: headline = "Hora de agir: alguns meses vão apertar se nada mudar."
        }
        return XRayReport(score: clamped, headline: headline, insights: insights)
    }
}
