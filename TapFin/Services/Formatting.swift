import Foundation

enum SettingsKey {
    static let userName = "userName"
    static let hideValues = "hideValues"
    static let lastExpenseCategory = "lastExpenseCategory"
}

extension Locale {
    static let brazil = Locale(identifier: "pt_BR")
}

extension Decimal {
    func brl(signed: Bool = false) -> String {
        let text = magnitude.formatted(.currency(code: "BRL").locale(.brazil))
        guard signed, self != 0 else { return self < 0 ? "-\(text)" : text }
        return self < 0 ? "-\(text)" : "+\(text)"
    }

    var doubleValue: Double { NSDecimalNumber(decimal: self).doubleValue }

    /// Arredonda para centavos.
    var roundedToCents: Decimal {
        var source = self
        var result = Decimal()
        NSDecimalRound(&result, &source, 2, .plain)
        return result
    }
}

extension Calendar {
    func startOfMonth(for date: Date) -> Date {
        self.date(from: dateComponents([.year, .month], from: date)) ?? date
    }

    func addingMonths(_ months: Int, to date: Date) -> Date {
        self.date(byAdding: .month, value: months, to: date) ?? date
    }

    func monthsBetween(_ start: Date, _ end: Date) -> Int {
        dateComponents([.month], from: startOfMonth(for: start), to: startOfMonth(for: end)).month ?? 0
    }
}

extension Date {
    /// "outubro"
    var monthName: String {
        formatted(.dateTime.month(.wide).locale(.brazil))
    }

    /// "out"
    var shortMonthName: String {
        formatted(.dateTime.month(.abbreviated).locale(.brazil)).replacingOccurrences(of: ".", with: "")
    }

    /// "outubro de 2026"
    var monthYear: String {
        formatted(.dateTime.month(.wide).year().locale(.brazil))
    }

    /// "01 de out."
    var dayMonth: String {
        formatted(.dateTime.day(.twoDigits).month(.abbreviated).locale(.brazil))
    }
}

extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }

    /// Primeira letra maiúscula: "outubro" → "Outubro".
    var capitalizedFirst: String { prefix(1).uppercased() + dropFirst() }
}
