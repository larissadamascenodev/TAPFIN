import Charts
import SwiftUI

/// Aba "Previsão": quanto sobra em cada mês e como fica o saldo ao longo do ano.
struct ForecastDashboard: View {
    let entries: [MoneyEntry]
    let accounts: [Account]

    @AppStorage(SettingsKey.hideValues) private var hideValues = false
    @State private var horizon = 6

    private var months: [MonthSummary] { FinanceEngine.months(count: horizon, entries: entries) }

    private var points: [BalancePoint] {
        zip(months, balances).map { BalancePoint(month: $0.month, balance: $1) }
    }

    private var balances: [Decimal] {
        let current = FinanceEngine.balance(accounts: accounts, entries: entries)
        return FinanceEngine.projectedBalances(start: current, months: months, entries: entries)
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                ForEach([3, 6, 12], id: \.self) { value in
                    Chip(title: "\(value) meses", isSelected: horizon == value) {
                        withAnimation(.smooth) { horizon = value }
                    }
                }
                Spacer()
            }

            Card(padding: 18) {
                VStack(alignment: .leading, spacing: 14) {
                    WidgetHeader(title: "Sobra prevista por mês", showsChevron: false)
                    Chart(months) { month in
                        BarMark(
                            x: .value("Mês", month.month, unit: .month),
                            y: .value("Sobra", month.net.doubleValue)
                        )
                        .foregroundStyle(month.net >= 0 ? Theme.lime : Theme.expense)
                        .cornerRadius(6)
                    }
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .month)) { value in
                            AxisValueLabel {
                                if let date = value.as(Date.self) {
                                    Text(date.shortMonthName)
                                }
                            }
                        }
                    }
                    .chartYAxis(hideValues ? .hidden : .automatic)
                    .frame(height: 190)
                }
            }

            Card(padding: 18) {
                VStack(alignment: .leading, spacing: 14) {
                    WidgetHeader(title: "Saldo projetado nas contas", showsChevron: false)
                    Chart(points) { point in
                        AreaMark(
                            x: .value("Mês", point.month, unit: .month),
                            y: .value("Saldo", point.balance.doubleValue)
                        )
                        .foregroundStyle(LinearGradient(colors: [Theme.lime.opacity(0.35), .clear], startPoint: .top, endPoint: .bottom))
                        .interpolationMethod(.catmullRom)

                        LineMark(
                            x: .value("Mês", point.month, unit: .month),
                            y: .value("Saldo", point.balance.doubleValue)
                        )
                        .foregroundStyle(Theme.lime)
                        .lineStyle(StrokeStyle(lineWidth: 2.5))
                        .interpolationMethod(.catmullRom)
                        .symbol(.circle)
                    }
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .month)) { value in
                            AxisValueLabel {
                                if let date = value.as(Date.self) {
                                    Text(date.shortMonthName)
                                }
                            }
                        }
                    }
                    .chartYAxis(hideValues ? .hidden : .automatic)
                    .frame(height: 170)
                }
            }

            Card {
                VStack(spacing: 0) {
                    ForEach(Array(months.enumerated()), id: \.element.id) { index, month in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(month.month.monthYear.capitalizedFirst)
                                    .font(.subheadline.weight(.semibold))
                                HStack(spacing: 4) {
                                    MoneyText(value: month.income, font: .caption, color: Theme.income)
                                    Text("·").foregroundStyle(Theme.textTertiary)
                                    MoneyText(value: month.expense, font: .caption, color: Theme.expense)
                                }
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                MoneyText(value: month.net, font: .subheadline.weight(.semibold), color: month.net >= 0 ? .white : Theme.expense, signed: true)
                                if index < balances.count {
                                    HStack(spacing: 3) {
                                        Text("saldo").foregroundStyle(Theme.textTertiary)
                                        MoneyText(value: balances[index], font: .caption, color: Theme.textSecondary)
                                    }
                                    .font(.caption)
                                }
                            }
                        }
                        .padding(.vertical, 10)
                        if index < months.count - 1 {
                            Divider().overlay(Theme.cardStroke)
                        }
                    }
                }
            }

            Text("A previsão soma lançamentos agendados, recorrentes, parcelas e faturas de cartão no mês em que vencem.")
                .font(.caption)
                .foregroundStyle(Theme.textTertiary)
                .padding(.horizontal, 4)
        }
    }
}

private struct BalancePoint: Identifiable {
    let month: Date
    let balance: Decimal
    var id: Date { month }
}
