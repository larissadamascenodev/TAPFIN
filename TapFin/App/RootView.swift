import SwiftUI

struct RootView: View {
    @Environment(AppRouter.self) private var router
    @AppStorage(SettingsKey.userName) private var userName = ""

    var body: some View {
        @Bindable var router = router

        Group {
            if userName.isEmpty {
                OnboardingView()
            } else {
                ZStack(alignment: .bottom) {
                    Theme.background.ignoresSafeArea()

                    Group {
                        switch router.tab {
                        case .home: HomeView()
                        case .entries: EntriesView()
                        case .xray: XRayView()
                        case .assistant: AssistantView()
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                    FloatingTabBar()
                        .padding(.horizontal, Theme.gutter)
                        .padding(.bottom, 4)
                        .ignoresSafeArea(.keyboard)
                }
                .sheet(isPresented: $router.isQuickAddPresented) {
                    QuickAddView(initialKind: router.quickAddKind)
                }
                .sheet(isPresented: $router.isSettingsPresented) {
                    SettingsView()
                }
            }
        }
        .animation(.smooth, value: userName.isEmpty)
    }
}

#Preview {
    RootView()
        .environment(AppRouter.shared)
        .modelContainer(Persistence.preview)
        .preferredColorScheme(.dark)
}
