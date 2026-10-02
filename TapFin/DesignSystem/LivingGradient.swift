import SwiftUI

/// Gradiente "vivo" do topo da Home. A cor reflete a saúde do mês:
/// verde quando sobra bem, laranja quando está apertado, vermelho quando vai faltar.
struct LivingGradient: View {
    var mood: FinancialMood = .neutral

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30, paused: reduceMotion)) { context in
            let t = Float(context.date.timeIntervalSinceReferenceDate)
            let wobble: Float = reduceMotion ? 0 : 0.12
            let center = SIMD2<Float>(0.5 + wobble * sin(t * 0.6), 0.45 + wobble * cos(t * 0.5))
            let points: [SIMD2<Float>] = [
                SIMD2(0, 0), SIMD2(0.5, 0), SIMD2(1, 0),
                SIMD2(0, 0.5), center, SIMD2(1, 0.5),
                SIMD2(0, 1), SIMD2(0.5, 1), SIMD2(1, 1)
            ]
            MeshGradient(width: 3, height: 3, points: points, colors: mood.colors)
        }
        .overlay(
            LinearGradient(
                colors: [.clear, Theme.background.opacity(0.6), Theme.background],
                startPoint: .center,
                endPoint: .bottom
            )
        )
        .animation(.easeInOut(duration: 1.2), value: mood)
    }
}

enum FinancialMood: Equatable {
    case neutral, healthy, tight, negative

    var colors: [Color] {
        let blue = Color(red: 0.16, green: 0.36, blue: 1.0)
        let red = Color(red: 1.0, green: 0.22, blue: 0.30)
        let orange = Color(red: 1.0, green: 0.52, blue: 0.14)
        let lime = Color(red: 0.70, green: 1.0, blue: 0.20)
        let teal = Color(red: 0.10, green: 0.80, blue: 0.62)
        let dark = Theme.background

        switch self {
        case .neutral:
            return [blue, red, red, blue, orange, orange, dark, dark, dark]
        case .healthy:
            return [teal, blue, lime, blue, lime, teal, dark, dark, dark]
        case .tight:
            return [orange, red, orange, blue, orange, red, dark, dark, dark]
        case .negative:
            return [red, red, orange, red, red, orange, dark, dark, dark]
        }
    }
}
