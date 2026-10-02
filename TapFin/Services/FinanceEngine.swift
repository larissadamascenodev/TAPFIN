import Foundation

struct MonthSummary: Identifiable, Hashable {
    let month: Date
    var income: Decimal = 0
    var expense: Decimal = 0

    var net: Decimal { income - expense }
    var id: Date { month }

    /// Fração da receita já comprometida com gastos (0...1+).
    var commitment: Double {
        guard income > 0 else { return expense > 0 ? 1 : 0 }
        return (expense / income).doubleValue
    }
}

struct CategoryTotal: Identifiable, Hashable {
    let category: EntryCategory
    let total: Decimal
    var id: EntryCategory { category }
}

/// Uma compra hipotética usada no simulador "Posso comprar?".
struct SimulatedPurchase {
    var amount: Decimal
    var installments: Int
    var startMonth: Date
}

/// Toda a matemática financeira do app. Funções puras sobre os lançamentos —
/// fáceis de testar e reaproveitadas pela Home, Previsão, Raio-X e pelo Fin.
enum FinanceEngine {
    static let calendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = .brazil
        calendar.timeZone = .current
        return calendar
    }()

    // MARK: - Fluxo de caixa

    /// Mês em que o lançamento afeta o caixa. Compras no cartão caem no mês de vencimento da fatura.
    static func cashMonth(of entry: MoneyEntry) -> Date {
        if entry.kind == .expense, let card = entry.card {
            return card.invoiceMonth(forPurchaseOn: entry.date, calendar: calendar)
        }
        return calendar.startOfMonth(for: entry.date)
    }

    /// Se o lançamento entra no caixa de um mês (considerando recorrência).
    static func occurs(_ entry: MoneyEntry, inCashMonth month: Date) -> Bool {
        let base = cashMonth(of: entry)
        let target = calendar.startOfMonth(for: month)
        return entry.isRecurring ? target >= base : target == base
    }

    /// Receitas x gastos de `count` meses a partir de `start`. É a base da previsão do que vai sobrar.
    static func months(from start: Date = .now, count: Int, entries: [MoneyEntry], simulation: SimulatedPurchase? = nil) -> [MonthSummary] {
        let first = calendar.startOfMonth(for: start)
        var result = (0..<count).map { MonthSummary(month: calendar.addingMonths($0, to: first)) }

        for entry in entries {
            let base = cashMonth(of: entry)
            for index in result.indices {
                let month = result[index].month
                let hits = entry.isRecurring ? month >= base : month == base
                guard hits else { continue }
                if entry.kind == .income {
                    result[index].income += entry.amount
                } else {
                    result[index].expense += entry.amount
                }
            }
        }

        if let simulation, simulation.installments > 0, simulation.amount > 0 {
            let part = (simulation.amount / Decimal(simulation.installments)).roundedToCents
            let simStart = calendar.startOfMonth(for: simulation.startMonth)
            for index in result.indices {
                let offset = calendar.monthsBetween(simStart, result[index].month)
                if offset >= 0 && offset < simulation.installments {
                    result[index].expense += part
                }
            }
        }
        return result
    }

    static func summary(for month: Date = .now, entries: [MoneyEntry]) -> MonthSummary {
        months(from: month, count: 1, entries: entries).first ?? MonthSummary(month: month)
    }

    // MARK: - Saldo

    /// Saldo atual das contas: saldo inicial + lançamentos já ocorridos que não são de cartão.
    static func balance(accounts: [Account], entries: [MoneyEntry], at date: Date = .now) -> Decimal {
        let opening = accounts.reduce(Decimal(0)) { $0 + $1.openingBalance }
        let moved = entries
            .filter { $0.card == nil }
            .reduce(Decimal(0)) { $0 + $1.signedAmount * Decimal(occurrenceCount(of: $1, until: date)) }
        return opening + moved
    }

    static func balance(of account: Account, entries: [MoneyEntry], at date: Date = .now) -> Decimal {
        balance(accounts: [account], entries: entries.filter { $0.account?.id == account.id }, at: date)
    }

    /// Quantas vezes um lançamento já aconteceu até `date` (recorrentes contam uma vez por mês).
    static func occurrenceCount(of entry: MoneyEntry, until date: Date) -> Int {
        guard entry.date <= date else { return 0 }
        guard entry.isRecurring else { return 1 }
        var count = 0
        var occurrence = entry.date
        while occurrence <= date, count < 600 {
            count += 1
            occurrence = calendar.addingMonths(count, to: entry.date)
        }
        return count
    }

    /// Saldo projetado ao final de cada mês da previsão.
    static func projectedBalances(start balance: Decimal, months: [MonthSummary], entries: [MoneyEntry], now: Date = .now) -> [Decimal] {
        // O que do mês atual ainda não aconteceu (agendados, recorrentes futuros, fatura do mês).
        var running = balance
        var result: [Decimal] = []
        for (index, month) in months.enumerated() {
            if index == 0 {
                running += remainingNet(entries: entries, now: now)
            } else {
                running += month.net
            }
            result.append(running)
        }
        return result
    }

    /// Parte do mês atual que ainda vai acontecer.
    static func remainingNet(entries: [MoneyEntry], now: Date = .now) -> Decimal {
        let month = calendar.startOfMonth(for: now)
        var total = Decimal(0)
        for entry in entries where occurs(entry, inCashMonth: month) {
            if entry.card != nil && entry.kind == .expense {
                // Fatura ainda não paga: entra inteira no mês do vencimento.
                total += entry.signedAmount
                continue
            }
            let dateThisMonth = entry.isRecurring ? dateInMonth(of: entry, month: month) : entry.date
            if dateThisMonth > now {
                total += entry.signedAmount
            }
        }
        return total
    }

    private static func dateInMonth(of entry: MoneyEntry, month: Date) -> Date {
        let offset = calendar.monthsBetween(entry.date, month)
        return calendar.addingMonths(offset, to: entry.date)
    }

    // MARK: - Gastos

    static func expenses(inCashMonth month: Date, entries: [MoneyEntry]) -> [MoneyEntry] {
        entries.filter { $0.kind == .expense && occurs($0, inCashMonth: month) }
    }

    /// Gastos agrupados por categoria (data de compra, não de fatura — é o que a pessoa sente).
    static func spendingByCategory(month: Date = .now, entries: [MoneyEntry]) -> [CategoryTotal] {
        let target = calendar.startOfMonth(for: month)
        var totals: [EntryCategory: Decimal] = [:]
        for entry in entries where entry.kind == .expense {
            let base = calendar.startOfMonth(for: entry.date)
            let hits = entry.isRecurring ? target >= base : target == base
            if hits { totals[entry.category, default: 0] += entry.amount }
        }
        return totals
            .map { CategoryTotal(category: $0.key, total: $0.value) }
            .sorted { $0.total > $1.total }
    }

    /// Recorrências de gasto (assinaturas, aluguel, contas fixas).
    static func recurringExpenses(entries: [MoneyEntry]) -> [MoneyEntry] {
        entries.filter { $0.isRecurring && $0.kind == .expense }
    }

    /// Parcelas que ainda vão vencer.
    static func remainingInstallments(entries: [MoneyEntry], now: Date = .now) -> [MoneyEntry] {
        let currentMonth = calendar.startOfMonth(for: now)
        return entries.filter { $0.isInstallment && cashMonth(of: $0) >= currentMonth }
    }

    // MARK: - Cartões

    static func invoice(of card: CreditCard, month: Date, entries: [MoneyEntry]) -> Decimal {
        let target = calendar.startOfMonth(for: month)
        return entries
            .filter { $0.card?.id == card.id && $0.kind == .expense && occurs($0, inCashMonth: target) }
            .reduce(Decimal(0)) { $0 + $1.amount }
    }

    /// Limite comprometido: tudo que está na fatura atual e nas futuras.
    static func usedLimit(of card: CreditCard, entries: [MoneyEntry], now: Date = .now) -> Decimal {
        let currentMonth = calendar.startOfMonth(for: now)
        return entries
            .filter { $0.card?.id == card.id && $0.kind == .expense }
            .reduce(Decimal(0)) { total, entry in
                let base = cashMonth(of: entry)
                if entry.isRecurring {
                    return total + (base <= currentMonth ? entry.amount : 0)
                }
                return total + (base >= currentMonth ? entry.amount : 0)
            }
    }

    static func totalInvoices(cards: [CreditCard], entries: [MoneyEntry], month: Date = .now) -> Decimal {
        cards.reduce(Decimal(0)) { $0 + invoice(of: $1, month: month, entries: entries) }
    }

    // MARK: - Humor do mês

    static func mood(for summary: MonthSummary, hasData: Bool) -> FinancialMood {
        guard hasData else { return .neutral }
        if summary.net < 0 { return .negative }
        if summary.commitment > 0.85 { return .tight }
        return .healthy
    }
}
