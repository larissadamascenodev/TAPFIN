import Foundation
import SwiftData

/// Um lançamento (receita ou gasto). Lançamentos com data futura são "agendados"
/// e entram na previsão; `isRecurring` repete o lançamento todo mês a partir da data.
@Model
final class MoneyEntry {
    var id: UUID = UUID()
    var title: String = ""
    var amount: Decimal = 0
    var kindRaw: String = EntryKind.expense.rawValue
    var categoryRaw: String = EntryCategory.other.rawValue
    var date: Date = Date()
    var isRecurring: Bool = false
    /// 0 quando não é parcelado.
    var installmentNumber: Int = 0
    var installmentTotal: Int = 0
    /// Agrupa as parcelas de uma mesma compra.
    var groupID: UUID?
    var note: String = ""
    var createdAt: Date = Date()

    var account: Account?
    var card: CreditCard?

    init(
        title: String,
        amount: Decimal,
        kind: EntryKind,
        category: EntryCategory,
        date: Date = .now,
        isRecurring: Bool = false
    ) {
        self.title = title
        self.amount = amount
        self.kindRaw = kind.rawValue
        self.categoryRaw = category.rawValue
        self.date = date
        self.isRecurring = isRecurring
    }

    var kind: EntryKind {
        get { EntryKind(rawValue: kindRaw) ?? .expense }
        set { kindRaw = newValue.rawValue }
    }

    var category: EntryCategory {
        get { EntryCategory(rawValue: categoryRaw) ?? .other }
        set { categoryRaw = newValue.rawValue }
    }

    var isInstallment: Bool { installmentTotal > 1 }

    var isScheduled: Bool { date > .now }

    /// Valor com sinal: positivo para receitas, negativo para gastos.
    var signedAmount: Decimal { kind == .income ? amount : -amount }

    var displayTitle: String {
        isInstallment ? "\(title) (\(installmentNumber)/\(installmentTotal))" : title
    }

    var sourceName: String? {
        card?.name ?? account?.name
    }
}
