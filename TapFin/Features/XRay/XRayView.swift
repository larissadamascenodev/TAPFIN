import Charts
import SwiftData
import SwiftUI

/// Raio-X financeiro: nota de saúde, alertas antes de apertar e o simulador "Posso comprar?".
struct XRayView: View {
    @Query(sort: \MoneyEntry.date, order: .reverse) private var entries: [MoneyEntry]
    @Query(sort: \Account.createdAt) private var accounts: [Account]
    @Query(sort: \CreditCard.createdAt) private var cards: [CreditCard]

    private var report: XRayReport {
        XRayAnalyzer.analyze(entries: entries, accounts: accounts, cards: cards)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Raio-X")
                        .font(.system(size: 34, weight: .bold))
                        .padding(.top, 8)

                    scoreCard
                    PurchaseSimulator(entries: entries)

                    if !report.insights.isEmpty {
                        Text("O que o Raio-X encontrou")
                            .font(.headline)
                            .padding(.top, 6)
                        ForEach(report.insights) { insight in
                            InsightCard(insight: insight)
                        }
                    }
                }
                .padding(.horizontal, Theme.gutter)
                .padding(.bottom, 120)
            }
            .scrollIndicators(.hidden)
            .background(Theme.background)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var scoreCard: some View {
        Card(padding: 20) {
            HStack(spacing: 18) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.08), lineWidth: 10)
                    Circle()
                        .trim(from: 0, to: Double(report.score) / 100)
                        .stroke(scoreColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text(entries.isEmpty ? "–" : "\(report.score)")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                        Text("de 100").font(.caption2).foregroundStyle(Theme.textSecondary)
                    }
                }
                .frame(width: 96, height: 96)
                .animation(.smooth(duration: 0.8), value: report.score)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Saúde financeira")
                        .font(.caption)
                        .foregroundStyle(Theme.textSecondary)
                    Text(report.headline)
                        .font(.subheadline.weight(.medium))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var scoreColor: Color {
        switch report.score {
        case 80...: Theme.lime
        case 55..<80: Theme.warning
        default: Theme.expense
        }
    }
}

struct InsightCard: View {
    let insight: Insight

    var body: some View {
        Card {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: insight.symbol)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(insight.tint)
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(insight.tint.opacity(0.15)))
                VStack(alignment: .leading, spacing: 4) {
                    Text(insight.title).font(.subheadline.weight(.semibold))
                    Text(insight.message)
                        .font(.footnote)
                        .foregroundStyle(Theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}

/// "Posso comprar?": mostra mês a mês quanto a compra tira do que ia sobrar.
struct PurchaseSimulator: View {
    let entries: [MoneyEntry]

    @State private var value: Decimal?
    @State private var installments = 1
    @FocusState private var focused: Bool

    private var simulation: SimulatedPurchase? {
        guard let value, value > 0 else { return nil }
        return SimulatedPurchase(amount: value, installments: installments, startMonth: .now)
    }

    private var before: [MonthSummary] { FinanceEngine.months(count: 6, entries: entries) }
    private var after: [MonthSummary] { FinanceEngine.months(count: 6, entries: entries, simulation: simulation) }

    var body: some View {
        Card(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Image(systemName: "cart.badge.questionmark")
                        .foregroundStyle(Theme.lime)
                    Text("Posso comprar?").font(.headline)
                }

                HStack(spacing: 10) {
                    TextField("Valor da compra", value: $value, format: .currency(code: "BRL"))
                        .keyboardType(.decimalPad)
                        .focused($focused)
                        .font(.title3.weight(.semibold))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.elevated))

                    Menu {
                        ForEach(1...24, id: \.self) { count in
                            Button(count == 1 ? "À vista" : "\(count)x") { installments = count }
                        }
                    } label: {
                        Text(installments == 1 ? "À vista" : "\(installments)x")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 14)
                            .background(Capsule().fill(Theme.lime))
                    }
                }

                if simulation != nil {
                    Chart {
                        ForEach(before) { month in
                            BarMark(
                                x: .value("Mês", month.month, unit: .month),
                                y: .value("Sobra", month.net.doubleValue)
                            )
                            .foregroundStyle(by: .value("Cenário", "Hoje"))
                            .position(by: .value("Cenário", "Hoje"))
                        }
                        ForEach(after) { month in
                            BarMark(
                                x: .value("Mês", month.month, unit: .month),
                                y: .value("Sobra", month.net.doubleValue)
                            )
                            .foregroundStyle(by: .value("Cenário", "Com a compra"))
                            .position(by: .value("Cenário", "Com a compra"))
                        }
                    }
                    .chartForegroundStyleScale(["Hoje": Color.white.opacity(0.3), "Com a compra": Theme.lime])
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .month)) { value in
                            AxisValueLabel {
                                if let date = value.as(Date.self) { Text(date.shortMonthName) }
                            }
                        }
                    }
                    .frame(height: 170)

                    verdict
                } else {
                    Text("Digite o valor e veja o impacto antes de passar o cartão.")
                        .font(.footnote)
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("OK") { focused = false }
            }
        }
    }

    @ViewBuilder
    private var verdict: some View {
        let negative = after.first { $0.net < 0 }
        let part = (simulation?.amount ?? 0) / Decimal(max(installments, 1))
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: negative == nil ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                .foregroundStyle(negative == nil ? Theme.lime : Theme.expense)
            if let negative {
                Text("Com essa compra, \(negative.month.monthName) fecha faltando \(negative.net.magnitude.brl()). Tente mais parcelas, um valor menor ou espere alguns meses.")
            } else {
                Text("Cabe no seu orçamento. São \(part.roundedToCents.brl()) por mês e o pior mês ainda sobra \((after.map(\.net).min() ?? 0).brl()).")
            }
        }
        .font(.footnote)
        .fixedSize(horizontal: false, vertical: true)
    }
}
