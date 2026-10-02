import SwiftUI

/// Card de vidro escuro usado em todos os widgets.
struct Card<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .fill(Theme.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)
                    .strokeBorder(Theme.cardStroke, lineWidth: 1)
            )
    }
}

/// Cabeçalho padrão de widget: título discreto + chevron.
struct WidgetHeader: View {
    let title: String
    var showsChevron = true

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
            Spacer()
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
    }
}

/// Valor monetário que respeita o modo "ocultar valores" (olhinho no topo).
struct MoneyText: View {
    let value: Decimal
    var font: Font = .title3.weight(.semibold)
    var color: Color = Theme.textPrimary
    var signed = false

    @AppStorage(SettingsKey.hideValues) private var hideValues = false

    var body: some View {
        Text(hideValues ? "R$ ••••" : value.brl(signed: signed))
            .font(font)
            .foregroundStyle(color)
            .monospacedDigit()
            .contentTransition(.numericText())
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }
}

/// Ícone redondo de categoria.
struct CategoryBadge: View {
    let category: EntryCategory
    var size: CGFloat = 36

    var body: some View {
        Image(systemName: category.symbol)
            .font(.system(size: size * 0.42, weight: .semibold))
            .foregroundStyle(category.color)
            .frame(width: size, height: size)
            .background(Circle().fill(category.color.opacity(0.16)))
    }
}

/// Pílula selecionável (filtros, categorias, contas).
struct Chip: View {
    let title: String
    var symbol: String?
    var tint: Color = Theme.lime
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let symbol {
                    Image(systemName: symbol).font(.caption.weight(.semibold))
                }
                Text(title).font(.subheadline.weight(.medium))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .foregroundStyle(isSelected ? Color.black : Theme.textPrimary)
            .background(Capsule().fill(isSelected ? tint : Theme.card))
            .overlay(Capsule().strokeBorder(isSelected ? Color.clear : Theme.cardStroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

/// Botão principal verde-limão.
struct PrimaryButtonStyle: ButtonStyle {
    var isEnabled = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 17)
            .background(Capsule().fill(Theme.lime.opacity(isEnabled ? 1 : 0.35)))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(duration: 0.25), value: configuration.isPressed)
    }
}

/// Barra horizontal de progresso arredondada.
struct ProgressBar: View {
    let progress: Double
    var tint: Color = Theme.lime
    var height: CGFloat = 8

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.08))
                Capsule()
                    .fill(tint)
                    .frame(width: max(height, proxy.size.width * min(max(progress, 0), 1)))
            }
        }
        .frame(height: height)
    }
}

/// Estado vazio padrão dentro de um card.
struct EmptyCardState: View {
    let symbol: String
    let title: String
    let actionTitle: String
    let action: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.title2)
                .foregroundStyle(Theme.textSecondary)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(Theme.textSecondary)
                .multilineTextAlignment(.center)
            Button(action: action) {
                Label(actionTitle, systemImage: "plus")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Capsule().fill(Theme.elevated))
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}
