import AppIntents
import SwiftData

// O iOS não deixa apps detectarem diretamente o "toque duplo nas costas" nem lerem tags NFC
// em segundo plano. O caminho oficial é via Atalhos: o usuário aponta o Toque nas Costas
// (Ajustes → Acessibilidade → Toque) ou uma automação de NFC para um destes intents.

/// Abre o TapFin direto no lançamento rápido.
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Lançamento rápido"
    static var description = IntentDescription("Abre o TapFin direto na tela de novo lançamento.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        AppRouter.shared.presentQuickAdd(kind: .expense)
        return .result()
    }
}

/// Abre o TapFin direto no lançamento de receita.
struct QuickIncomeIntent: AppIntent {
    static var title: LocalizedStringResource = "Nova receita"
    static var description = IntentDescription("Abre o TapFin para lançar uma entrada de dinheiro.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        AppRouter.shared.presentQuickAdd(kind: .income)
        return .result()
    }
}

/// Registra um gasto sem abrir o app (Siri, Atalhos, automação de NFC).
struct LogExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Registrar gasto"
    static var description = IntentDescription("Registra um gasto no TapFin sem abrir o app.")

    @Parameter(title: "Valor")
    var amount: Double

    @Parameter(title: "Descrição", default: "Gasto rápido")
    var label: String

    static var parameterSummary: some ParameterSummary {
        Summary("Registrar gasto de \(\.$amount) — \(\.$label)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let value = Decimal(amount).roundedToCents
        let context = Persistence.container.mainContext
        let category = EntryCategory(rawValue: UserDefaults.standard.string(forKey: SettingsKey.lastExpenseCategory) ?? "") ?? .other
        EntryFactory.insert(
            .init(title: label.trimmed.isEmpty ? category.title : label, amount: value, kind: .expense, category: category),
            into: context
        )
        let message = "Pronto! \(value.brl()) lançado em \(category.title)."
        return .result(dialog: "\(message)")
    }
}

struct TapFinShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: QuickAddIntent(),
            phrases: [
                "Lançar no \(.applicationName)",
                "Novo gasto no \(.applicationName)",
                "Abrir lançamento do \(.applicationName)"
            ],
            shortTitle: "Lançamento rápido",
            systemImageName: "plus.circle.fill"
        )
        AppShortcut(
            intent: QuickIncomeIntent(),
            phrases: ["Nova receita no \(.applicationName)"],
            shortTitle: "Nova receita",
            systemImageName: "arrow.down.circle.fill"
        )
        AppShortcut(
            intent: LogExpenseIntent(),
            phrases: ["Registrar gasto no \(.applicationName)"],
            shortTitle: "Registrar gasto",
            systemImageName: "minus.circle.fill"
        )
    }
}
