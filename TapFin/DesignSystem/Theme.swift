import SwiftUI

/// Tokens visuais do TapFin: fundo quase preto, cards de vidro e o verde-limão como cor de ação.
enum Theme {
    static let background = Color(red: 0.031, green: 0.031, blue: 0.039)
    static let card = Color.white.opacity(0.06)
    static let cardStroke = Color.white.opacity(0.08)
    static let elevated = Color.white.opacity(0.10)

    static let lime = Color(red: 0.82, green: 1.0, blue: 0.18)
    static let income = Color(red: 0.36, green: 0.90, blue: 0.52)
    static let expense = Color(red: 1.0, green: 0.36, blue: 0.38)
    static let warning = Color(red: 1.0, green: 0.56, blue: 0.20)
    static let info = Color(red: 0.36, green: 0.58, blue: 1.0)

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.55)
    static let textTertiary = Color.white.opacity(0.35)

    static let radius: CGFloat = 26
    static let gutter: CGFloat = 16
}

extension Color {
    /// Cria uma cor a partir de "RRGGBB".
    init(hex: String) {
        let clean = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: clean).scanHexInt64(&value)
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

/// Paleta oferecida ao criar contas e cartões.
enum Swatch {
    static let all = ["8A05BE", "FF7A00", "2E6BFF", "00A86B", "EC0000", "FFCC00", "1C1C1E", "D1FF2E"]
}
