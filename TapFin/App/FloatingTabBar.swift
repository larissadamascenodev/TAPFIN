import SwiftUI

/// Barra inferior flutuante. O botão central é o "tap": lança uma transação na hora.
struct FloatingTabBar: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        HStack(spacing: 0) {
            item(.home, symbol: "house.fill", label: "Início")
            item(.entries, symbol: "arrow.left.arrow.right", label: "Lançamentos")

            Button {
                router.presentQuickAdd()
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.black)
                    .frame(width: 58, height: 58)
                    .background(Circle().fill(Theme.lime))
                    .shadow(color: Theme.lime.opacity(0.45), radius: 14, y: 4)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 10)
            .accessibilityLabel("Novo lançamento")
            .sensoryFeedback(.impact(weight: .medium), trigger: router.isQuickAddPresented)

            item(.xray, symbol: "waveform.path.ecg", label: "Raio-X")
            item(.assistant, symbol: "sparkles", label: "Fin")
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().strokeBorder(Theme.cardStroke, lineWidth: 1))
        .shadow(color: .black.opacity(0.5), radius: 20, y: 8)
    }

    private func item(_ tab: AppTab, symbol: String, label: String) -> some View {
        let isSelected = router.tab == tab
        return Button {
            router.tab = tab
        } label: {
            Image(systemName: symbol)
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(isSelected ? Theme.lime : Theme.textSecondary)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.white.opacity(0.08) : .clear)
                )
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .sensoryFeedback(.selection, trigger: isSelected)
    }
}
