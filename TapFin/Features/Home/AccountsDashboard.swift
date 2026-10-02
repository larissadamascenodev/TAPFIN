import SwiftUI

/// Aba "Contas" da Home: grade de widgets com o essencial do mês.
struct AccountsDashboard: View {
    @Environment(AppRouter.self) private var router

    let entries: [MoneyEntry]
    let accounts: [Account]
    let cards: [CreditCard]
    let onAddAccount: () -> Void
    let onShowCards: () -> Void
    let onShowForecast: () -> Void

    private var month: MonthSummary { FinanceEngine.summary(entries: entries) }

    var body: some View {
        VStack(spacing: 12) {
            if accounts.isEmpty && entries.isEmpty {
                Card {
                    EmptyCardState(
                        symbol: "building.columns",
                        title: "Adicione suas contas e comece a ver quanto vai sobrar no mês.",
                        actionTitle: "Adicionar conta",
                        action: onAddAccount
                    )
                }
            }

            MonthForecastCard(summary: month)

            HStack(alignment: .top, spacing: 12) {
                NavigationLink {
                    AccountsView()
                } label: {
                    BalanceCard(accounts: accounts, entries: entries)
                }
                .buttonStyle(.plain)

                Button(action: onShowCards) {
                    InvoicesCard(cards: cards, entries: entries)
                }
                .buttonStyle(.plain)
            }

            CategorySpendingCard(totals: FinanceEngine.spendingByCategory(entries: entries))

            Button {
                router.tab = .entries
            } label: {
                RecentEntriesCard(entries: Array(entries.filter { !$0.isScheduled }.prefix(3)), count: entries.count)
            }
            .buttonStyle(.plain)

            HStack(alignment: .top, spacing: 12) {
                SubscriptionsCard(entries: entries)
                InstallmentsCard(entries: entries)
            }

            Button(action: onShowForecast) {
                NextMonthsCard(months: FinanceEngine.months(count: 6, entries: entries))
            }
            .buttonStyle(.plain)
        }
    }
}

// MARK: - Widgets

/// O destaque da Home: quanto vai sobrar no mês, já contando agendados, parcelas e faturas.
struct MonthForecastCard: View {
    let summary: MonthSummary

    var body: some View {
        Card(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                WidgetHeader(title: summary.net >= 0 ? "Vai sobrar em \(summary.month.monthName)" : "Vai faltar em \(summary.month.monthName)", showsChevron: false)
                MoneyText(
                    value: summary.net.magnitude,
                    font: .system(size: 38, weight: .semibold, design: .rounded),
                    color: summary.net >= 0 ? .white : Theme.expense
                )

                ProgressBar(
                    progress: summary.commitment,
                    tint: summary.commitment > 1 ? Theme.expense : (summary.commitment > 0.85 ? Theme.warning : Theme.lime),
                    height: 10
                )

                HStack {
                    flow(title: "Entradas", value: summary.income, color: Theme.income, symbol: "arrow.down.left")
                    Spacer()
                    flow(title: "Saídas", value: summary.expense, color: Theme.expense, symbol: "arrow.up.right")
                }
            }
        }
    }

    private func flow(title: String, value: Decimal, color: Color, symbol: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: symbol)
                .font(.caption.weight(.bold))
                .foregroundStyle(color)
                .frame(width: 26, height: 26)
                .background(Circle().fill(color.opacity(0.15)))
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.caption).foregroundStyle(Theme.textSecondary)
                MoneyText(value: value, font: .subheadline.weight(.semibold))
            }
        }
    }
}

struct BalanceCard: View {
    let accounts: [Account]
    let entries: [MoneyEntry]

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 8) {
                WidgetHeader(title: "Saldo em contas")
                MoneyText(value: FinanceEngine.balance(accounts: accounts, entries: entries))
                HStack(spacing: -6) {
                    ForEach(accounts.prefix(4)) { account in
                        Circle()
                            .fill(Color(hex: account.colorHex))
                            .frame(width: 22, height: 22)
                            .overlay(Text(String(account.name.prefix(1))).font(.caption2.bold()).foregroundStyle(.white))
                            .overlay(Circle().strokeBorder(Theme.background, lineWidth: 2))
                    }
                    if accounts.isEmpty {
                        Text("Nenhuma conta").font(.caption).foregroundStyle(Theme.textTertiary)
                    }
                }
                .frame(height: 22)
            }
        }
    }
}

struct InvoicesCard: View {
    let cards: [CreditCard]
    let entries: [MoneyEntry]

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 8) {
                WidgetHeader(title: "Total em faturas")
                MoneyText(value: FinanceEngine.totalInvoices(cards: cards, entries: entries))
                Text(cards.isEmpty ? "Nenhum cartão" : "\(cards.count) cart\(cards.count > 1 ? "ões" : "ão")")
                    .font(.caption)
                    .foregroundStyle(Theme.textTertiary)
                    .frame(height: 22, alignment: .leading)
            }
        }
    }
}

struct CategorySpendingCard: View {
    let totals: [CategoryTotal]

    private var sum: Decimal { totals.reduce(Decimal(0)) { $0 + $1.total } }

    var body: some View {
        Card(padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                WidgetHeader(title: "Gastos por categoria · este mês", showsChevron: false)
                MoneyText(value: sum, font: .title2.weight(.semibold))

                GeometryReader { proxy in
                    HStack(spacing: 3) {
                        if totals.isEmpty {
                            Capsule().fill(Color.white.opacity(0.08))
                        }
                        ForEach(totals) { item in
                            Capsule()
                                .fill(item.category.color)
                                .frame(width: max(6, proxy.size.width * share(of: item) - 3))
                        }
                    }
                }
                .frame(height: 10)

                if totals.isEmpty {
                    Text("Sem gastos lançados neste mês")
                        .font(.caption)
                        .foregroundStyle(Theme.textTertiary)
                } else {
                    VStack(spacing: 8) {
                        ForEach(totals.prefix(3)) { item in
                            HStack(spacing: 10) {
                                Circle().fill(item.category.color).frame(width: 8, height: 8)
                                Text(item.category.title).font(.subheadline)
                                Spacer()
                                Text("\(Int(share(of: item) * 100))%")
                                    .font(.caption)
                                    .foregroundStyle(Theme.textSecondary)
                                MoneyText(value: item.total, font: .subheadline.weight(.medium))
                                    .frame(minWidth: 90, alignment: .trailing)
                            }
                        }
                    }
                }
            }
        }
    }

    private func share(of item: CategoryTotal) -> Double {
        guard sum > 0 else { return 0 }
        return (item.total / sum).doubleValue
    }
}

struct RecentEntriesCard: View {
    let entries: [MoneyEntry]
    let count: Int

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Transações recentes")
                if entries.isEmpty {
                    Text("Toque no + para lançar a primeira")
                        .font(.subheadline)
                        .foregroundStyle(Theme.textTertiary)
                } else {
                    ForEach(entries) { entry in
                        EntryRow(entry: entry)
                    }
                }
            }
        }
    }
}

struct SubscriptionsCard: View {
    let entries: [MoneyEntry]

    var body: some View {
        let recurring = FinanceEngine.recurringExpenses(entries: entries)
        let total = recurring.reduce(Decimal(0)) { $0 + $1.amount }
        Card {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "repeat")
                    .foregroundStyle(Theme.textSecondary)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Theme.elevated))
                Text("Fixos e assinaturas").font(.caption).foregroundStyle(Theme.textSecondary)
                MoneyText(value: total, font: .headline)
                Text(recurring.isEmpty ? "Nenhum" : "\(recurring.count) por mês")
                    .font(.caption)
                    .foregroundStyle(Theme.textTertiary)
            }
        }
    }
}

struct InstallmentsCard: View {
    let entries: [MoneyEntry]

    var body: some View {
        let remaining = FinanceEngine.remainingInstallments(entries: entries)
        let total = remaining.reduce(Decimal(0)) { $0 + $1.amount }
        let groups = Set(remaining.compactMap(\.groupID)).count
        Card {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "square.stack.3d.up.fill")
                    .foregroundStyle(Theme.textSecondary)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Theme.elevated))
                Text("Parcelamentos").font(.caption).foregroundStyle(Theme.textSecondary)
                MoneyText(value: total, font: .headline)
                Text(groups == 0 ? "Nenhum" : "\(groups) compra\(groups > 1 ? "s" : "") em aberto")
                    .font(.caption)
                    .foregroundStyle(Theme.textTertiary)
            }
        }
    }
}

/// Mini-gráfico do que sobra nos próximos meses.
struct NextMonthsCard: View {
    let months: [MonthSummary]

    @AppStorage(SettingsKey.hideValues) private var hideValues = false

    var body: some View {
        let peak = max(months.map { abs($0.net.doubleValue) }.max() ?? 1, 1)
        Card(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                WidgetHeader(title: "Quanto sobra nos próximos meses")
                HStack(alignment: .bottom, spacing: 10) {
                    ForEach(months) { month in
                        VStack(spacing: 6) {
                            if !hideValues {
                                Text(Self.compact(month.net))
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(month.net >= 0 ? Theme.textSecondary : Theme.expense)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.5)
                            }
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(month.net >= 0 ? Theme.lime : Theme.expense)
                                .frame(height: max(6, 70 * abs(month.net.doubleValue) / peak))
                            Text(month.month.shortMonthName)
                                .font(.caption2)
                                .foregroundStyle(Theme.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 110, alignment: .bottom)
            }
        }
    }

    static func compact(_ value: Decimal) -> String {
        let number = value.doubleValue
        let sign = number < 0 ? "-" : ""
        let magnitude = abs(number)
        if magnitude >= 1_000 {
            return "\(sign)\((magnitude / 1_000).formatted(.number.precision(.fractionLength(0...1)).locale(.brazil)))k"
        }
        return "\(sign)\(Int(magnitude))"
    }
}

/// Linha de lançamento usada em listas.
struct EntryRow: View {
    let entry: MoneyEntry

    var body: some View {
        HStack(spacing: 12) {
            CategoryBadge(category: entry.category)
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.displayTitle)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Text(entry.date.dayMonth)
                    Text("·")
                    Text(entry.category.title)
                    if let source = entry.sourceName {
                        Text("·")
                        Text(source)
                    }
                    if entry.isRecurring {
                        Image(systemName: "repeat")
                    }
                }
                .font(.caption)
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(1)
            }
            Spacer(minLength: 8)
            MoneyText(
                value: entry.signedAmount,
                font: .subheadline.weight(.semibold),
                color: entry.kind == .income ? Theme.income : Theme.expense,
                signed: true
            )
        }
        .opacity(entry.isScheduled ? 0.6 : 1)
    }
}
