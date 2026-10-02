import SwiftData
import SwiftUI

/// Aba "Cartões": fatura atual, limite usado e as próximas faturas de cada cartão.
struct CardsDashboard: View {
    let entries: [MoneyEntry]
    let cards: [CreditCard]
    let onAddCard: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            if cards.isEmpty {
                Card {
                    EmptyCardState(
                        symbol: "creditcard",
                        title: "Cadastre seus cartões para acompanhar faturas, limite e parcelas em tempo real.",
                        actionTitle: "Adicionar cartão",
                        action: onAddCard
                    )
                }
            } else {
                ForEach(cards) { card in
                    NavigationLink {
                        CardDetailView(card: card)
                    } label: {
                        CardSummaryCard(card: card, entries: entries)
                    }
                    .buttonStyle(.plain)
                }

                Button(action: onAddCard) {
                    Label("Adicionar cartão", systemImage: "plus")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Capsule().fill(Theme.card))
                        .overlay(Capsule().strokeBorder(Theme.cardStroke, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct CardSummaryCard: View {
    let card: CreditCard
    let entries: [MoneyEntry]

    var body: some View {
        let now = Date.now
        let invoiceMonth = card.invoiceMonth(forPurchaseOn: now, calendar: FinanceEngine.calendar)
        let invoice = FinanceEngine.invoice(of: card, month: invoiceMonth, entries: entries)
        let used = FinanceEngine.usedLimit(of: card, entries: entries, now: now)
        let ratio = card.creditLimit > 0 ? (used / card.creditLimit).doubleValue : 0

        Card(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(Color(hex: card.colorHex))
                        .frame(width: 34, height: 24)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .strokeBorder(Color.white.opacity(0.2), lineWidth: 1)
                        )
                    Text(card.name).font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Theme.textTertiary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Fatura aberta · vence \(card.dueDate(inInvoiceMonth: invoiceMonth).dayMonth)")
                        .font(.caption)
                        .foregroundStyle(Theme.textSecondary)
                    MoneyText(value: invoice, font: .system(size: 30, weight: .semibold, design: .rounded))
                }

                VStack(alignment: .leading, spacing: 6) {
                    ProgressBar(progress: ratio, tint: ratio > 0.8 ? Theme.expense : (ratio > 0.6 ? Theme.warning : Theme.lime))
                    HStack {
                        Text("Limite usado").foregroundStyle(Theme.textSecondary)
                        MoneyText(value: used, font: .caption.weight(.semibold))
                        Spacer()
                        Text("Disponível").foregroundStyle(Theme.textSecondary)
                        MoneyText(value: max(card.creditLimit - used, 0), font: .caption.weight(.semibold), color: Theme.lime)
                    }
                    .font(.caption)
                }
            }
        }
    }
}

/// Detalhe do cartão: próximas faturas e lançamentos da fatura selecionada.
struct CardDetailView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \MoneyEntry.date, order: .reverse) private var entries: [MoneyEntry]

    let card: CreditCard

    @State private var selectedMonth: Date = FinanceEngine.calendar.startOfMonth(for: .now)
    @State private var confirmDelete = false

    private var invoiceMonths: [Date] {
        let first = card.invoiceMonth(forPurchaseOn: .now, calendar: FinanceEngine.calendar)
        return (0..<6).map { FinanceEngine.calendar.addingMonths($0, to: first) }
    }

    private var invoiceEntries: [MoneyEntry] {
        entries.filter { $0.card?.id == card.id && $0.kind == .expense && FinanceEngine.occurs($0, inCashMonth: selectedMonth) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScrollView(.horizontal) {
                    HStack(spacing: 8) {
                        ForEach(invoiceMonths, id: \.self) { month in
                            Chip(
                                title: month.shortMonthName.capitalizedFirst,
                                isSelected: FinanceEngine.calendar.isDate(month, equalTo: selectedMonth, toGranularity: .month)
                            ) {
                                selectedMonth = month
                            }
                        }
                    }
                }
                .scrollIndicators(.hidden)

                Card(padding: 18) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Fatura de \(selectedMonth.monthName) · vence \(card.dueDate(inInvoiceMonth: selectedMonth).dayMonth)")
                            .font(.caption)
                            .foregroundStyle(Theme.textSecondary)
                        MoneyText(value: FinanceEngine.invoice(of: card, month: selectedMonth, entries: entries), font: .system(size: 34, weight: .semibold, design: .rounded))
                        Text("Fecha dia \(card.closingDay) · Limite \(card.creditLimit.brl())")
                            .font(.caption)
                            .foregroundStyle(Theme.textTertiary)
                    }
                }

                Card {
                    VStack(alignment: .leading, spacing: 12) {
                        WidgetHeader(title: "\(invoiceEntries.count) lançamento\(invoiceEntries.count == 1 ? "" : "s")", showsChevron: false)
                        if invoiceEntries.isEmpty {
                            Text("Nada nesta fatura ainda.")
                                .font(.subheadline)
                                .foregroundStyle(Theme.textTertiary)
                        }
                        ForEach(invoiceEntries) { entry in
                            EntryRow(entry: entry)
                        }
                    }
                }
            }
            .padding(Theme.gutter)
            .padding(.bottom, 100)
        }
        .background(Theme.background)
        .navigationTitle(card.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(role: .destructive) {
                    confirmDelete = true
                } label: {
                    Image(systemName: "trash")
                }
            }
        }
        .confirmationDialog("Excluir \(card.name)?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Excluir cartão", role: .destructive) {
                // Sai da tela antes de apagar para a view não ler um modelo já excluído.
                dismiss()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    context.delete(card)
                    try? context.save()
                }
            }
        } message: {
            Text("Os lançamentos continuam salvos, mas deixam de estar ligados a este cartão.")
        }
        .onAppear {
            selectedMonth = invoiceMonths.first ?? selectedMonth
        }
    }
}
