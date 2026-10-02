import Foundation
import SwiftData

/// Dados de exemplo para demonstrar o app (Ajustes → Carregar exemplo) e para os Previews.
@MainActor
enum SampleData {
    static func load(into context: ModelContext) {
        let calendar = FinanceEngine.calendar
        let now = Date.now
        let monthStart = calendar.startOfMonth(for: now)
        func day(_ day: Int, monthOffset: Int = 0) -> Date {
            let month = calendar.addingMonths(monthOffset, to: monthStart)
            return calendar.date(byAdding: .day, value: day - 1, to: month) ?? month
        }

        let nubank = Account(name: "Nubank", openingBalance: 1_850, colorHex: "8A05BE")
        let inter = Account(name: "Inter", openingBalance: 4_200, colorHex: "FF7A00")
        let card = CreditCard(name: "Nubank Roxinho", creditLimit: 6_000, closingDay: 3, dueDay: 10, colorHex: "8A05BE")
        context.insert(nubank)
        context.insert(inter)
        context.insert(card)

        let drafts: [EntryFactory.Draft] = [
            .init(title: "Salário", amount: 7_500, kind: .income, category: .salary, date: day(5, monthOffset: -1), isRecurring: true, account: nubank),
            .init(title: "Aluguel", amount: 2_100, kind: .expense, category: .home, date: day(8, monthOffset: -1), isRecurring: true, account: nubank),
            .init(title: "Internet", amount: 119.90, kind: .expense, category: .bills, date: day(15, monthOffset: -1), isRecurring: true, account: nubank),
            .init(title: "Netflix", amount: 44.90, kind: .expense, category: .subscriptions, date: day(12, monthOffset: -1), isRecurring: true, card: card),
            .init(title: "Spotify", amount: 21.90, kind: .expense, category: .subscriptions, date: day(20, monthOffset: -1), isRecurring: true, card: card),
            .init(title: "Academia", amount: 129.90, kind: .expense, category: .health, date: day(10, monthOffset: -1), isRecurring: true, account: inter),
            .init(title: "iPhone", amount: 4_800, kind: .expense, category: .shopping, date: day(2, monthOffset: -2), installments: 10, card: card),
            .init(title: "Passagem Lisboa", amount: 3_200, kind: .expense, category: .travel, date: day(1), installments: 6, card: card),
            .init(title: "Mercado", amount: 612.40, kind: .expense, category: .groceries, date: day(1), card: card),
            .init(title: "iFood", amount: 86.50, kind: .expense, category: .food, date: day(1), card: card),
            .init(title: "Uber", amount: 34.20, kind: .expense, category: .transport, date: day(1), account: nubank),
            .init(title: "Restaurante", amount: 300, kind: .expense, category: .food, date: day(1), account: nubank),
            .init(title: "Freela site", amount: 1_800, kind: .income, category: .freelance, date: day(25), account: inter),
            .init(title: "Mercado", amount: 540, kind: .expense, category: .groceries, date: day(6, monthOffset: -1), card: card),
            .init(title: "Bar", amount: 180, kind: .expense, category: .leisure, date: day(18, monthOffset: -1), account: nubank),
            .init(title: "IPVA", amount: 1_450, kind: .expense, category: .transport, date: day(10, monthOffset: 2), account: nubank)
        ]
        for draft in drafts {
            EntryFactory.insert(draft, into: context)
        }
    }
}
