import SwiftData
import SwiftUI

/// Lançamento em dois toques: digita o valor e salva. Categoria, conta e data já vêm sugeridas.
struct QuickAddView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Account.createdAt) private var accounts: [Account]
    @Query(sort: \CreditCard.createdAt) private var cards: [CreditCard]
    @AppStorage(SettingsKey.lastExpenseCategory) private var lastExpenseCategory = EntryCategory.food.rawValue

    @State private var kind: EntryKind
    @State private var cents = 0
    @State private var category: EntryCategory
    @State private var title = ""
    @State private var date = Date.now
    @State private var account: Account?
    @State private var card: CreditCard?
    @State private var installments = 1
    @State private var isRecurring = false
    @State private var showDatePicker = false
    @State private var savedTrigger = 0

    init(initialKind: EntryKind = .expense) {
        _kind = State(initialValue: initialKind)
        let stored = UserDefaults.standard.string(forKey: SettingsKey.lastExpenseCategory) ?? ""
        let fallback: EntryCategory = initialKind == .income ? .salary : .food
        let suggested = EntryCategory(rawValue: stored).flatMap { $0.kind == initialKind ? $0 : nil }
        _category = State(initialValue: suggested ?? fallback)
    }

    private var amount: Decimal { Decimal(cents) / 100 }
    private var isCardPurchase: Bool { kind == .expense && card != nil }

    var body: some View {
        VStack(spacing: 0) {
            topBar
                .padding(.horizontal, Theme.gutter)
                .padding(.top, 14)

            ScrollView {
                VStack(spacing: 18) {
                    amountDisplay
                    TextField("Descrição (opcional)", text: $title)
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                    categoryPicker
                    sourcePicker
                    optionsRow
                }
                .padding(.vertical, 12)
            }
            .scrollIndicators(.hidden)

            Keypad(cents: $cents)
                .padding(.horizontal, Theme.gutter)

            Button(action: save) {
                Text(saveTitle)
            }
            .buttonStyle(PrimaryButtonStyle(isEnabled: cents > 0))
            .disabled(cents == 0)
            .padding(.horizontal, Theme.gutter)
            .padding(.vertical, 12)
        }
        .background(Theme.background.ignoresSafeArea())
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .sensoryFeedback(.success, trigger: savedTrigger)
        .onChange(of: kind) { _, newKind in
            if category.kind != newKind {
                category = newKind == .income ? .salary : (EntryCategory(rawValue: lastExpenseCategory) ?? .food)
            }
            if newKind == .income { card = nil }
        }
        .onAppear {
            if account == nil && card == nil { account = accounts.first }
        }
        .sheet(isPresented: $showDatePicker) {
            DatePicker("Data", selection: $date, displayedComponents: .date)
                .datePickerStyle(.graphical)
                .environment(\.locale, .brazil)
                .padding()
                .presentationDetents([.medium])
        }
    }

    // MARK: - Partes

    private var topBar: some View {
        HStack {
            Button("Cancelar") { dismiss() }
                .foregroundStyle(Theme.textSecondary)
            Spacer()
            HStack(spacing: 4) {
                ForEach(EntryKind.allCases) { item in
                    Button {
                        withAnimation(.smooth) { kind = item }
                    } label: {
                        Text(item.title)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(kind == item ? .black : .white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(kind == item ? item.tint : .clear))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(4)
            .background(Capsule().fill(Theme.card))
            Spacer()
            Color.clear.frame(width: 64, height: 1)
        }
    }

    private var amountDisplay: some View {
        VStack(spacing: 6) {
            Text(amount.brl())
                .font(.system(size: 52, weight: .semibold, design: .rounded))
                .foregroundStyle(cents == 0 ? Theme.textTertiary : kind.tint)
                .monospacedDigit()
                .contentTransition(.numericText(value: amount.doubleValue))
                .animation(.snappy, value: cents)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .padding(.horizontal)
            if isCardPurchase && installments > 1 {
                Text("\(installments)x de \((amount / Decimal(installments)).roundedToCents.brl())")
                    .font(.subheadline)
                    .foregroundStyle(Theme.textSecondary)
            }
        }
        .padding(.top, 8)
    }

    private var categoryPicker: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(EntryCategory.options(for: kind)) { item in
                    Chip(title: item.title, symbol: item.symbol, tint: item.color, isSelected: category == item) {
                        category = item
                    }
                }
            }
            .padding(.horizontal, Theme.gutter)
        }
        .scrollIndicators(.hidden)
        .sensoryFeedback(.selection, trigger: category)
    }

    @ViewBuilder
    private var sourcePicker: some View {
        if !accounts.isEmpty || (!cards.isEmpty && kind == .expense) {
            ScrollView(.horizontal) {
                HStack(spacing: 8) {
                    ForEach(accounts) { item in
                        Chip(title: item.name, symbol: "building.columns.fill", tint: .white, isSelected: account?.id == item.id) {
                            account = item
                            card = nil
                        }
                    }
                    if kind == .expense {
                        ForEach(cards) { item in
                            Chip(title: item.name, symbol: "creditcard.fill", tint: .white, isSelected: card?.id == item.id) {
                                card = item
                                account = nil
                            }
                        }
                    }
                }
                .padding(.horizontal, Theme.gutter)
            }
            .scrollIndicators(.hidden)
        }
    }

    private var optionsRow: some View {
        HStack(spacing: 8) {
            Menu {
                Button("Hoje") { date = .now }
                Button("Ontem") { date = Calendar.current.date(byAdding: .day, value: -1, to: .now) ?? .now }
                Button("Escolher data…") { showDatePicker = true }
            } label: {
                optionLabel(symbol: "calendar", text: dateLabel, isActive: !Calendar.current.isDateInToday(date))
            }

            if isCardPurchase {
                Menu {
                    ForEach(1...24, id: \.self) { value in
                        Button(value == 1 ? "À vista" : "\(value)x") { installments = value }
                    }
                } label: {
                    optionLabel(symbol: "square.stack.3d.up", text: installments == 1 ? "À vista" : "\(installments)x", isActive: installments > 1)
                }
            }

            Button {
                isRecurring.toggle()
                if isRecurring { installments = 1 }
            } label: {
                optionLabel(symbol: "repeat", text: "Todo mês", isActive: isRecurring)
            }
            .buttonStyle(.plain)
        }
    }

    private func optionLabel(symbol: String, text: String, isActive: Bool) -> some View {
        HStack(spacing: 6) {
            Image(systemName: symbol)
            Text(text)
        }
        .font(.footnote.weight(.semibold))
        .foregroundStyle(isActive ? .black : Theme.textSecondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Capsule().fill(isActive ? Theme.lime : Theme.card))
    }

    private var dateLabel: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Hoje" }
        if calendar.isDateInYesterday(date) { return "Ontem" }
        return date.dayMonth
    }

    private var saveTitle: String {
        guard cents > 0 else { return "Digite o valor" }
        if date > .now && !Calendar.current.isDateInToday(date) { return "Agendar \(kind.title.lowercased())" }
        return "Salvar \(kind.title.lowercased())"
    }

    // MARK: - Ações

    private func save() {
        guard cents > 0 else { return }
        let finalTitle = title.trimmed.isEmpty ? category.title : title.trimmed
        EntryFactory.insert(
            .init(
                title: finalTitle,
                amount: amount,
                kind: kind,
                category: category,
                date: date,
                isRecurring: isRecurring,
                installments: isCardPurchase && !isRecurring ? installments : 1,
                account: card == nil ? account : nil,
                card: kind == .expense ? card : nil
            ),
            into: context
        )
        if kind == .expense { lastExpenseCategory = category.rawValue }
        savedTrigger += 1
        dismiss()
    }
}

/// Teclado numérico próprio: valor entra como em app de banco (centavos primeiro).
struct Keypad: View {
    @Binding var cents: Int

    private let keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"]

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
            ForEach(keys, id: \.self) { key in
                Button {
                    press(key)
                } label: {
                    Group {
                        if key == "⌫" {
                            Image(systemName: "delete.left")
                        } else {
                            Text(key)
                        }
                    }
                    .font(.system(size: 26, weight: .medium, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.card))
                }
                .buttonStyle(KeyStyle())
                .accessibilityLabel(key == "⌫" ? "Apagar" : key)
            }
        }
        .sensoryFeedback(.impact(weight: .light), trigger: cents)
    }

    private func press(_ key: String) {
        switch key {
        case "⌫":
            cents /= 10
        case "00":
            if cents < 10_000_000 { cents *= 100 }
        default:
            guard let digit = Int(key), cents < 100_000_000 else { return }
            cents = cents * 10 + digit
        }
    }
}

private struct KeyStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.94 : 1)
            .opacity(configuration.isPressed ? 0.7 : 1)
            .animation(.spring(duration: 0.18), value: configuration.isPressed)
    }
}

#Preview {
    QuickAddView()
        .modelContainer(Persistence.preview)
        .preferredColorScheme(.dark)
}
