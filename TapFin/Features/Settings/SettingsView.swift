import SwiftData
import SwiftUI
import UIKit

struct SettingsView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @AppStorage(SettingsKey.userName) private var userName = ""
    @AppStorage(SettingsKey.hideValues) private var hideValues = false

    @State private var confirmDelete = false
    @State private var showBackTapGuide = false

    private var version: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "\(short) (\(build))"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Perfil") {
                    TextField("Seu nome", text: $userName)
                    Toggle("Ocultar valores ao abrir", isOn: $hideValues)
                }

                Section {
                    Button {
                        showBackTapGuide = true
                    } label: {
                        Label("Lançar com dois toques nas costas", systemImage: "iphone.gen3.radiowaves.left.and.right")
                    }
                } header: {
                    Text("Lançamento rápido")
                } footer: {
                    Text("Também funciona com Siri (\"Lançar no TapFin\"), botão de Ação e etiquetas NFC.")
                }

                Section("Dados") {
                    Button("Carregar dados de exemplo") {
                        SampleData.load(into: context)
                    }
                    Button("Apagar todos os meus dados", role: .destructive) {
                        confirmDelete = true
                    }
                }

                Section {
                    // TODO: trocar pelas URLs reais antes de enviar para a App Store.
                    Link("Política de privacidade", destination: URL(string: "https://tapfin.app/privacidade")!)
                    Link("Termos de uso", destination: URL(string: "https://tapfin.app/termos")!)
                    Link("Fale com a gente", destination: URL(string: "mailto:suporte@tapfin.app")!)
                } footer: {
                    Text("TapFin \(version) · Seus dados ficam só no seu iPhone.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Ajustes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") { dismiss() }
                }
            }
            .confirmationDialog("Apagar tudo?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Apagar todos os dados", role: .destructive) {
                    Persistence.deleteAll(in: context)
                    userName = ""
                    dismiss()
                }
            } message: {
                Text("Contas, cartões e lançamentos serão apagados deste aparelho. Não dá para desfazer.")
            }
            .sheet(isPresented: $showBackTapGuide) {
                BackTapGuideView()
            }
        }
    }
}

/// Passo a passo para ligar o "Toque nas Costas" do iPhone ao TapFin.
struct BackTapGuideView: View {
    @Environment(\.dismiss) private var dismiss

    private let steps: [(String, String)] = [
        ("gearshape.fill", "Abra Ajustes → Acessibilidade → Toque."),
        ("hand.tap.fill", "Desça até \"Tocar Atrás\" e escolha \"Toque Duplo\"."),
        ("square.stack.3d.up.fill", "Na lista de Atalhos, selecione \"Lançamento rápido\" do TapFin."),
        ("checkmark.seal.fill", "Pronto! Dois toques nas costas do iPhone abrem o lançamento.")
    ]

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 22) {
                Text("Dois toques nas costas do iPhone e você já está lançando.")
                    .font(.title3.weight(.semibold))
                ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 14) {
                        Image(systemName: step.0)
                            .foregroundStyle(.black)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(Theme.lime))
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Passo \(index + 1)").font(.caption).foregroundStyle(Theme.textSecondary)
                            Text(step.1).font(.body)
                        }
                    }
                }
                Text("Quer usar NFC? No app Atalhos, crie uma Automação → NFC, escaneie uma etiqueta e escolha \"Lançamento rápido\". Cole a etiqueta na carteira ou na mesa.")
                    .font(.footnote)
                    .foregroundStyle(Theme.textSecondary)
                Spacer()
                Button("Abrir Ajustes") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding(24)
            .background(Theme.background)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") { dismiss() }
                }
            }
        }
        .presentationDetents([.large])
    }
}
