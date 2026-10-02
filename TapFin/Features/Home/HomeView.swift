import SwiftData
import SwiftUI

enum HomeSegment: String, CaseIterable, Identifiable {
    case accounts = "Contas"
    case cards = "Cartões"
    case forecast = "Previsão"

    var id: String { rawValue }
}

struct HomeView: View {
    @Environment(AppRouter.self) private var router
    @AppStorage(SettingsKey.userName) private var userName = ""
    @AppStorage(SettingsKey.hideValues) private var hideValues = false

    @Query(sort: \MoneyEntry.date, order: .reverse) private var entries: [MoneyEntry]
    @Query(sort: \Account.createdAt) private var accounts: [Account]
    @Query(sort: \CreditCard.createdAt) private var cards: [CreditCard]

    @State private var segment: HomeSegment = .accounts
    @State private var showAddAccount = false
    @State private var showAddCard = false

    private var month: MonthSummary { FinanceEngine.summary(entries: entries) }
    private var mood: FinancialMood { FinanceEngine.mood(for: month, hasData: !entries.isEmpty) }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                Theme.background.ignoresSafeArea()

                LivingGradient(mood: mood)
                    .frame(height: 440)
                    .ignoresSafeArea(edges: .top)
                    .allowsHitTesting(false)

                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        header
                        segmentPicker
                        greeting
                            .padding(.top, 70)
                            .padding(.bottom, 8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .contentShape(Rectangle())
                            // "Dois toques na tela": toque duplo na saudação abre o lançamento rápido.
                            .onTapGesture(count: 2) { router.presentQuickAdd() }

                        switch segment {
                        case .accounts:
                            AccountsDashboard(
                                entries: entries,
                                accounts: accounts,
                                cards: cards,
                                onAddAccount: { showAddAccount = true },
                                onShowCards: { withAnimation(.smooth) { segment = .cards } },
                                onShowForecast: { withAnimation(.smooth) { segment = .forecast } }
                            )
                        case .cards:
                            CardsDashboard(entries: entries, cards: cards, onAddCard: { showAddCard = true })
                        case .forecast:
                            ForecastDashboard(entries: entries, accounts: accounts)
                        }

                        askFin
                    }
                    .padding(.horizontal, Theme.gutter)
                    .padding(.bottom, 120)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showAddAccount) { AccountFormView() }
            .sheet(isPresented: $showAddCard) { CardFormView() }
        }
    }

    // MARK: - Partes

    private var header: some View {
        HStack(spacing: 10) {
            Button {
                router.isSettingsPresented = true
            } label: {
                Text(String(userName.prefix(1)).uppercased())
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(.white))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Ajustes")

            Spacer()

            Button {
                withAnimation(.smooth) { hideValues.toggle() }
            } label: {
                Image(systemName: hideValues ? "eye.slash" : "eye")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(.ultraThinMaterial))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(hideValues ? "Mostrar valores" : "Ocultar valores")

            Button {
                router.tab = .xray
            } label: {
                HStack(spacing: 6) {
                    Text("Raio-X")
                        .font(.subheadline.weight(.bold))
                    Image(systemName: "waveform.path.ecg")
                        .font(.caption.weight(.bold))
                }
                .foregroundStyle(.black)
                .padding(.horizontal, 14)
                .frame(height: 40)
                .background(Capsule().fill(Theme.lime))
            }
            .buttonStyle(.plain)
        }
        .padding(.top, 6)
    }

    private var segmentPicker: some View {
        HStack(spacing: 6) {
            ForEach(HomeSegment.allCases) { item in
                let isSelected = segment == item
                Button {
                    withAnimation(.smooth) { segment = item }
                } label: {
                    Text(item.rawValue)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(isSelected ? .black : .white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(isSelected ? Color.white : Color.white.opacity(0.12)))
                }
                .buttonStyle(.plain)
                .sensoryFeedback(.selection, trigger: isSelected)
            }
        }
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(Self.greetingWord()), \(userName)")
                .font(.system(size: 32, weight: .regular))
                .foregroundStyle(.white)
            Text("Toque duas vezes aqui para lançar")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.55))
        }
    }

    private var askFin: some View {
        Button {
            router.tab = .assistant
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "sparkles")
                    .foregroundStyle(Theme.lime)
                Text("Pergunte ao Fin")
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()
                Image(systemName: "arrow.up.right")
                    .foregroundStyle(Theme.textTertiary)
            }
            .font(.body.weight(.medium))
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
            .background(Capsule().fill(Theme.card))
            .overlay(Capsule().strokeBorder(Theme.cardStroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .padding(.top, 6)
    }

    static func greetingWord(now: Date = .now) -> String {
        switch Calendar.current.component(.hour, from: now) {
        case 5..<12: "Bom dia"
        case 12..<18: "Boa tarde"
        default: "Boa noite"
        }
    }
}

#Preview {
    HomeView()
        .environment(AppRouter.shared)
        .modelContainer(Persistence.preview)
        .preferredColorScheme(.dark)
}
