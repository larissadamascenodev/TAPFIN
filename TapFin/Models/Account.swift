import Foundation
import SwiftData

/// Conta bancária ou carteira. O saldo atual é o saldo inicial + lançamentos já ocorridos.
@Model
final class Account {
    var id: UUID = UUID()
    var name: String = ""
    var openingBalance: Decimal = 0
    var colorHex: String = "8A05BE"
    var createdAt: Date = Date()

    @Relationship(deleteRule: .nullify, inverse: \MoneyEntry.account)
    var entries: [MoneyEntry]? = []

    init(name: String, openingBalance: Decimal, colorHex: String) {
        self.name = name
        self.openingBalance = openingBalance
        self.colorHex = colorHex
    }
}
