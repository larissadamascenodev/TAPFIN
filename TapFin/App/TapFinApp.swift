import SwiftData
import SwiftUI

@main
struct TapFinApp: App {
    @State private var router = AppRouter.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .preferredColorScheme(.dark)
                .tint(Theme.lime)
        }
        .modelContainer(Persistence.container)
    }
}
