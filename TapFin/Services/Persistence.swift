import Foundation
import SwiftData

/// Container único do SwiftData, compartilhado entre o app e os App Intents (Atalhos).
@MainActor
enum Persistence {
    static let schema = Schema([MoneyEntry.self, Account.self, CreditCard.self])

    static let container: ModelContainer = {
        do {
            let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
            return try ModelContainer(for: schema, configurations: configuration)
        } catch {
            fatalError("Não foi possível abrir o banco de dados: \(error)")
        }
    }()

    /// Container em memória para Previews do Xcode, já com dados de exemplo.
    static let preview: ModelContainer = {
        do {
            let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
            let container = try ModelContainer(for: schema, configurations: configuration)
            SampleData.load(into: container.mainContext)
            return container
        } catch {
            fatalError("Falha ao criar container de preview: \(error)")
        }
    }()

    /// Apaga todos os dados do usuário (exigência de privacidade da App Store).
    static func deleteAll(in context: ModelContext) {
        try? context.delete(model: MoneyEntry.self)
        try? context.delete(model: Account.self)
        try? context.delete(model: CreditCard.self)
        try? context.save()
    }
}
