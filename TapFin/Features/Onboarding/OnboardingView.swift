import SwiftUI

struct OnboardingView: View {
    @AppStorage(SettingsKey.userName) private var userName = ""
    @State private var name = ""
    @FocusState private var focused: Bool

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            LivingGradient(mood: .neutral)
                .ignoresSafeArea()
                .opacity(0.9)

            VStack(alignment: .leading, spacing: 18) {
                Spacer()

                HStack(spacing: 10) {
                    ZStack {
                        Circle().strokeBorder(Theme.lime, lineWidth: 3).frame(width: 40, height: 40)
                        Circle().fill(Theme.lime).frame(width: 14, height: 14)
                    }
                    Text("TapFin")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                }

                Text("Dois toques.\nSeu mês inteiro sob controle.")
                    .font(.system(size: 38, weight: .semibold))
                    .fixedSize(horizontal: false, vertical: true)

                Text("Saiba hoje quanto vai sobrar no fim do mês — e nos próximos. Lance gastos num toque, acompanhe faturas e deixe o Raio-X avisar antes de apertar.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.7))

                TextField("Como podemos te chamar?", text: $name)
                    .textContentType(.givenName)
                    .focused($focused)
                    .submitLabel(.go)
                    .onSubmit(start)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(Capsule().fill(.ultraThinMaterial))
                    .padding(.top, 10)

                Button("Começar", action: start)
                    .buttonStyle(PrimaryButtonStyle(isEnabled: !name.trimmed.isEmpty))
                    .disabled(name.trimmed.isEmpty)
            }
            .padding(24)
        }
    }

    private func start() {
        let trimmed = name.trimmed
        guard !trimmed.isEmpty else { return }
        withAnimation(.smooth) { userName = trimmed }
    }
}

#Preview {
    OnboardingView()
        .preferredColorScheme(.dark)
}
