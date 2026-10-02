import SwiftData
import SwiftUI

struct AccountsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Account.createdAt) private var accounts: [Account]
    @Query private var entries: [MoneyEntry]

    @State private var showForm = false

    var body: some View {
        List {
            Section {
                HStack {
                    Text("Total")
                        .foregroundStyle(Theme.textSecondary)
                    Spacer()
                    MoneyText(value: FinanceEngine.balance(accounts: accounts, entries: entries))
                }
            }
            .listRowBackground(Theme.card)

            Section("Contas") {
                ForEach(accounts) { account in
                    HStack(spacing: 12) {
                        Circle()
                            .fill(Color(hex: account.colorHex))
                            .frame(width: 34, height: 34)
                            .overlay(Text(String(account.name.prefix(1))).font(.subheadline.bold()).foregroundStyle(.white))
                        Text(account.name).font(.body.weight(.medium))
                        Spacer()
                        MoneyText(value: FinanceEngine.balance(of: account, entries: entries), font: .body.weight(.semibold))
                    }
                }
                .onDelete { offsets in
                    for index in offsets { context.delete(accounts[index]) }
                    try? context.save()
                }

                Button {
                    showForm = true
                } label: {
                    Label("Adicionar conta", systemImage: "plus")
                }
            }
            .listRowBackground(Theme.card)
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Contas")
        .sheet(isPresented: $showForm) { AccountFormView() }
    }
}

struct AccountFormView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var balance: Decimal?
    @State private var colorHex = Swatch.all[0]

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Nome (ex.: Nubank, Carteira)", text: $name)
                    TextField("Saldo atual", value: $balance, format: .currency(code: "BRL"))
                        .keyboardType(.decimalPad)
                } footer: {
                    Text("Por enquanto o saldo é informado por você. A conexão automática com bancos (Open Finance) vem numa próxima etapa.")
                }
                Section("Cor") {
                    SwatchPicker(selection: $colorHex)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Nova conta")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        context.insert(Account(name: name.trimmed, openingBalance: balance ?? 0, colorHex: colorHex))
                        try? context.save()
                        dismiss()
                    }
                    .disabled(name.trimmed.isEmpty)
                }
            }
        }
    }
}
