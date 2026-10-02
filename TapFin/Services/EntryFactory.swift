import Foundation
import SwiftData

/// Cria lançamentos já ligados à conta/cartão, incluindo compras parceladas.
@MainActor
enum EntryFactory {
    struct Draft {
        var title: String
        var amount: Decimal
        var kind: EntryKind
        var category: EntryCategory
        var date: Date = .now
        var isRecurring = false
        var installments = 1
        var account: Account?
        var card: CreditCard?
    }

    @discardableResult
    static func insert(_ draft: Draft, into context: ModelContext) -> [MoneyEntry] {
        let count = max(draft.installments, 1)
        let calendar = FinanceEngine.calendar

        guard count > 1 else {
            let entry = MoneyEntry(
                title: draft.title,
                amount: draft.amount,
                kind: draft.kind,
                category: draft.category,
                date: draft.date,
                isRecurring: draft.isRecurring
            )
            context.insert(entry)
            entry.account = draft.account
            entry.card = draft.card
            try? context.save()
            return [entry]
        }

        let part = (draft.amount / Decimal(count)).roundedToCents
        let group = UUID()
        let entries = (0..<count).map { index -> MoneyEntry in
            // A última parcela absorve a diferença de arredondamento.
            let value = index == count - 1 ? draft.amount - part * Decimal(count - 1) : part
            let entry = MoneyEntry(
                title: draft.title,
                amount: value,
                kind: draft.kind,
                category: draft.category,
                date: calendar.addingMonths(index, to: draft.date)
            )
            entry.installmentNumber = index + 1
            entry.installmentTotal = count
            entry.groupID = group
            return entry
        }
        for entry in entries {
            context.insert(entry)
            entry.account = draft.account
            entry.card = draft.card
        }
        try? context.save()
        return entries
    }
}
