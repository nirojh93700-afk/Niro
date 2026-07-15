import SwiftUI

@main
struct BouclierApp: App {
    @StateObject private var state = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(state)
                .tint(BrandColor.accent)
        }
    }
}

/// Couleurs de marque.
enum BrandColor {
    static let accent = Color(red: 0.16, green: 0.44, blue: 0.86)   // bleu bouclier
    static let safe = Color(red: 0.13, green: 0.62, blue: 0.38)
    static let suspect = Color(red: 0.86, green: 0.55, blue: 0.10)
    static let fraud = Color(red: 0.82, green: 0.22, blue: 0.22)
}

extension RiskLevel {
    var color: Color {
        switch self {
        case .safe: return BrandColor.safe
        case .info: return BrandColor.accent
        case .suspect: return BrandColor.suspect
        case .fraud: return BrandColor.fraud
        }
    }
    var icon: String {
        switch self {
        case .safe: return "checkmark.shield.fill"
        case .info: return "info.circle.fill"
        case .suspect: return "exclamationmark.triangle.fill"
        case .fraud: return "xmark.shield.fill"
        }
    }
    var frenchTitle: String {
        switch self {
        case .safe: return "Sûr"
        case .info: return "Info"
        case .suspect: return "Suspect"
        case .fraud: return "Frauduleux"
        }
    }
}
