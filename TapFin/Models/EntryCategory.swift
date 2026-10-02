import SwiftUI

enum EntryKind: String, Codable, CaseIterable, Identifiable {
    case expense
    case income

    var id: String { rawValue }

    var title: String {
        switch self {
        case .expense: "Gasto"
        case .income: "Receita"
        }
    }

    var tint: Color {
        switch self {
        case .expense: Theme.expense
        case .income: Theme.income
        }
    }
}

enum EntryCategory: String, Codable, CaseIterable, Identifiable {
    case food, groceries, transport, home, bills, health, leisure, shopping
    case subscriptions, education, travel, pets, other
    case salary, freelance, investments, extraIncome

    var id: String { rawValue }

    var title: String {
        switch self {
        case .food: "Alimentação"
        case .groceries: "Mercado"
        case .transport: "Transporte"
        case .home: "Casa"
        case .bills: "Contas"
        case .health: "Saúde"
        case .leisure: "Lazer"
        case .shopping: "Compras"
        case .subscriptions: "Assinaturas"
        case .education: "Educação"
        case .travel: "Viagem"
        case .pets: "Pets"
        case .other: "Outros"
        case .salary: "Salário"
        case .freelance: "Freela"
        case .investments: "Rendimentos"
        case .extraIncome: "Extra"
        }
    }

    var symbol: String {
        switch self {
        case .food: "fork.knife"
        case .groceries: "cart.fill"
        case .transport: "car.fill"
        case .home: "house.fill"
        case .bills: "bolt.fill"
        case .health: "cross.case.fill"
        case .leisure: "party.popper.fill"
        case .shopping: "bag.fill"
        case .subscriptions: "repeat"
        case .education: "book.fill"
        case .travel: "airplane"
        case .pets: "pawprint.fill"
        case .other: "square.grid.2x2.fill"
        case .salary: "banknote.fill"
        case .freelance: "briefcase.fill"
        case .investments: "chart.line.uptrend.xyaxis"
        case .extraIncome: "sparkles"
        }
    }

    var color: Color {
        switch self {
        case .food: Color(hex: "FF8A3D")
        case .groceries: Color(hex: "FFC53D")
        case .transport: Color(hex: "4D8DFF")
        case .home: Color(hex: "B07CFF")
        case .bills: Color(hex: "FFE14D")
        case .health: Color(hex: "FF5C7A")
        case .leisure: Color(hex: "FF66C4")
        case .shopping: Color(hex: "3DD6FF")
        case .subscriptions: Color(hex: "9B8CFF")
        case .education: Color(hex: "5CE1A6")
        case .travel: Color(hex: "3DA9FF")
        case .pets: Color(hex: "D9A066")
        case .other: Color(hex: "9DA3AE")
        case .salary, .freelance, .investments, .extraIncome: Theme.income
        }
    }

    var kind: EntryKind {
        switch self {
        case .salary, .freelance, .investments, .extraIncome: .income
        default: .expense
        }
    }

    static func options(for kind: EntryKind) -> [EntryCategory] {
        allCases.filter { $0.kind == kind }
    }
}
