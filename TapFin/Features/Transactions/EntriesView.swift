import SwiftData
import SwiftUI

/// Todos os lançamentos, mês a mês, com busca e filtro.
struct EntriesView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \MoneyEntry.date, order: .reverse) private var entries: [MoneyEntry]

    @State private var month = FinanceEngine.calendar.startOfMonth(for: .now)
    @State private var filter: EntryKind?
    @State private var search = ""

    private var calendar: Calendar { FinanceEngine.calendar }

    /// Lançamentos do mês pela data da compra; recorrentes aparecem em todo mês a partir do início.
    private var visible: [MoneyEntry] {
        entries.filter { entry in
            let base = calendar.startOfMonth(for: entry.date)
            let inMonth = entry.isRecurring ? month >= base : month == base
            let matchesKind = filter == nil || entry.kind == filter
            let matchesSearch = search.trimmed.isEmpty
                || entry.title.localizedCaseInsensitiveContains(search)
                || entry.category.title.localizedCaseInsensitiveContains(search)
            return inMonth && matchesKind && matchesSearch
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    monthSwitcher
                    summary
                    filters
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 6, leading: Theme.gutter, bottom: 6, trailing: Theme.gutter))

                Section {
                    if visible.isEmpty {
                        Text("Nenhum lançamento por aqui.")
                            .foregroundStyle(Theme.textTertiary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 30)
                            .listRowBackground(Color.clear)
                    }
                    ForEach(visible) { entry in
                        EntryRow(entry: entry)
                            .listRowBackground(Theme.card)
                            .swipeActions {
                                Button(role: .destructive) {
                                    delete(entry)
                                } label: {
                                    Label("Excluir", systemImage: "trash")
                                }
                            }
                    }
                }

                Color.clear.frame(height: 90).listRowBackground(Color.clear)
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Lançamentos")
            .searchable(text: $search, prompt: "Buscar")
        }
    }

    private var monthSwitcher: some View {
        HStack {
            Button {
                withAnimation(.smooth) { month = calendar.addingMonths(-1, to: month) }
            } label: {
                Image(systemName: "chevron.left").frame(width: 40, height: 40)
            }
            Spacer()
            Text(month.monthYear.capitalizedFirst)
                .font(.headline)
            Spacer()
            Button {
                withAnimation(.smooth) { month = calendar.addingMonths(1, to: month) }
            } label: {
                Image(systemName: "chevron.right").frame(width: 40, height: 40)
            }
        }
        .buttonStyle(.plain)
    }

    private var summary: some View {
        let income = visible.filter { $0.kind == .income }.reduce(Decimal(0)) { $0 + $1.amount }
        let expense = visible.filter { $0.kind == .expense }.reduce(Decimal(0)) { $0 + $1.amount }
        return HStack(spacing: 12) {
            Card {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Entradas").font(.caption).foregroundStyle(Theme.textSecondary)
                    MoneyText(value: income, font: .headline, color: Theme.income)
                }
            }
            Card {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Saídas").font(.caption).foregroundStyle(Theme.textSecondary)
                    MoneyText(value: expense, font: .headline, color: Theme.expense)
                }
            }
        }
    }

    private var filters: some View {
        HStack(spacing: 8) {
            Chip(title: "Tudo", isSelected: filter == nil) { filter = nil }
            Chip(title: "Gastos", isSelected: filter == .expense) { filter = .expense }
            Chip(title: "Receitas", isSelected: filter == .income) { filter = .income }
            Spacer()
        }
    }

    private func delete(_ entry: MoneyEntry) {
        // Excluir uma parcela exclui a compra parcelada inteira.
        if let group = entry.groupID {
            for item in entries where item.groupID == group {
                context.delete(item)
            }
        } else {
            context.delete(entry)
        }
        try? context.save()
    }
}
