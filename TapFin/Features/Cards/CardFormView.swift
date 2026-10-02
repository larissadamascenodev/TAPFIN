import SwiftUI

struct CardFormView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var limit: Decimal?
    @State private var closingDay = 3
    @State private var dueDay = 10
    @State private var colorHex = Swatch.all[0]

    private var canSave: Bool { !name.trimmed.isEmpty && (limit ?? 0) > 0 }

    var body: some View {
        NavigationStack {
            Form {
                Section("Cartão") {
                    TextField("Nome (ex.: Nubank)", text: $name)
                    TextField("Limite total", value: $limit, format: .currency(code: "BRL"))
                        .keyboardType(.decimalPad)
                }
                Section {
                    Picker("Fecha no dia", selection: $closingDay) {
                        ForEach(1...28, id: \.self) { Text("\($0)").tag($0) }
                    }
                    Picker("Vence no dia", selection: $dueDay) {
                        ForEach(1...28, id: \.self) { Text("\($0)").tag($0) }
                    }
                } footer: {
                    Text("Compras feitas depois do fechamento entram na fatura seguinte — é assim que a previsão sabe em que mês cada compra pesa.")
                }
                Section("Cor") {
                    SwatchPicker(selection: $colorHex)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Novo cartão")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        let card = CreditCard(name: name.trimmed, creditLimit: limit ?? 0, closingDay: closingDay, dueDay: dueDay, colorHex: colorHex)
                        context.insert(card)
                        try? context.save()
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
        .presentationDetents([.large])
    }
}

struct SwatchPicker: View {
    @Binding var selection: String

    var body: some View {
        HStack(spacing: 12) {
            ForEach(Swatch.all, id: \.self) { hex in
                Circle()
                    .fill(Color(hex: hex))
                    .frame(width: 30, height: 30)
                    .overlay(Circle().strokeBorder(.white, lineWidth: selection == hex ? 2.5 : 0))
                    .onTapGesture { selection = hex }
                    .accessibilityAddTraits(.isButton)
            }
        }
        .padding(.vertical, 4)
    }
}
