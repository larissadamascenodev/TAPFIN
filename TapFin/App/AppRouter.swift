import SwiftUI

enum AppTab: Hashable {
    case home, entries, xray, assistant
}

/// Estado de navegação global. Também é acionado pelos Atalhos (toque nas costas, NFC, Siri).
@MainActor
@Observable
final class AppRouter {
    static let shared = AppRouter()

    var tab: AppTab = .home
    var isQuickAddPresented = false
    var quickAddKind: EntryKind = .expense
    var isSettingsPresented = false

    func presentQuickAdd(kind: EntryKind = .expense) {
        quickAddKind = kind
        isQuickAddPresented = true
    }
}
