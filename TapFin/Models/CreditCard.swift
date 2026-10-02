import Foundation
import SwiftData

/// Cartão de crédito com limite, dia de fechamento e de vencimento.
@Model
final class CreditCard {
    var id: UUID = UUID()
    var name: String = ""
    var creditLimit: Decimal = 0
    var closingDay: Int = 1
    var dueDay: Int = 10
    var colorHex: String = "1C1C1E"
    var createdAt: Date = Date()

    @Relationship(deleteRule: .nullify, inverse: \MoneyEntry.card)
    var entries: [MoneyEntry]? = []

    init(name: String, creditLimit: Decimal, closingDay: Int, dueDay: Int, colorHex: String) {
        self.name = name
        self.creditLimit = creditLimit
        self.closingDay = closingDay
        self.dueDay = dueDay
        self.colorHex = colorHex
    }

    /// Mês (início) em que vence a fatura que contém uma compra feita em `date`.
    /// É esse o mês em que a compra sai do bolso — por isso a previsão usa ele.
    func invoiceMonth(forPurchaseOn date: Date, calendar: Calendar = .current) -> Date {
        let day = calendar.component(.day, from: date)
        var closingMonth = calendar.startOfMonth(for: date)
        if day > closingDay {
            closingMonth = calendar.addingMonths(1, to: closingMonth)
        }
        return dueDay > closingDay ? closingMonth : calendar.addingMonths(1, to: closingMonth)
    }

    /// Data de vencimento da fatura de um mês.
    func dueDate(inInvoiceMonth month: Date, calendar: Calendar = .current) -> Date {
        var components = calendar.dateComponents([.year, .month], from: month)
        let range = calendar.range(of: .day, in: .month, for: month) ?? 1..<29
        components.day = min(dueDay, range.upperBound - 1)
        return calendar.date(from: components) ?? month
    }
}
