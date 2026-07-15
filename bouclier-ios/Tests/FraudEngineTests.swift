import XCTest
@testable import Bouclier

/// Miroir Swift de `reference/verify.mjs` (déjà validé sous Node : 18/18).
/// Garantit que le moteur Swift se comporte comme la référence.
final class FraudEngineTests: XCTestCase {

    // MARK: SMS frauduleux
    func testSmishingIsFraud() {
        let cases: [(String, String)] = [
            ("36930", "Votre colis est en attente de livraison. Réglez les frais de douane: http://colissimo-suivi.xyz/pay"),
            ("+33712345678", "AMELI: votre carte vitale expire. Mettez à jour vos informations sous 24h: https://ameli-fr.top/maj"),
            ("Info", "IMPOTS: vous avez droit à un remboursement fiscal de 258€. Cliquez ici: https://impots-remboursement.icu"),
            ("06 11 22 33 44", "CPF: vos droits formation vont expirer. Confirmez immédiatement sur https://mon-compte-cpf.buzz"),
            ("38200", "Chronopost: adresse incomplète. Réexpédition, veuillez cliquer: https://bit.ly/xk29a"),
            ("Banque", "Opération suspecte sur votre carte bancaire. Confirmez votre code confidentiel: http://secure-boursorama.online"),
            ("ANTAI", "Amende impayée. Dernier avertissement avant majoration. Régularisez: https://antai-paiement.click"),
        ]
        for (sender, body) in cases {
            let v = FraudEngine.analyzeSMS(sender: sender, body: body)
            XCTAssertEqual(v.level, .fraud, "Devrait être FRAUD : \(body)")
        }
    }

    // MARK: SMS légitimes
    func testLegitIsSafe() {
        let cases: [(String, String)] = [
            ("Free Mobile", "Votre code de vérification est 481920. Ne le communiquez à personne."),
            ("La Poste", "Votre colis sera livré demain entre 9h et 12h. Suivi: https://www.laposte.fr/suivi"),
            ("31337", "Votre code de confirmation est 220044."),
            ("Maman", "Tu peux passer acheter du pain en rentrant ? Merci"),
        ]
        for (sender, body) in cases {
            let v = FraudEngine.analyzeSMS(sender: sender, body: body)
            XCTAssertEqual(v.level, .safe, "Devrait être SAFE : \(body)")
        }
    }

    // MARK: Numéros
    func testNumbers() {
        XCTAssertEqual(FraudEngine.classifyNumber("0162345678").label, "Démarchage (ARCEP)")
        XCTAssertEqual(FraudEngine.classifyNumber("09 48 12 34 56").label, "Démarchage (ARCEP)")
        XCTAssertEqual(FraudEngine.classifyNumber("0899701234").label, "Numéro surtaxé")
        XCTAssertEqual(FraudEngine.classifyNumber("0612345678").level, .safe)
        XCTAssertEqual(FraudEngine.classifyNumber("0612345678", allowlist: ["0612345678"]).level, .safe)
        XCTAssertEqual(FraudEngine.classifyNumber("0612345678", blocklist: ["06 12 34 56 78"]).level, .fraud)
        XCTAssertEqual(FraudEngine.classifyNumber("").level, .suspect)
    }

    // MARK: Normalisation
    func testNormalization() {
        XCTAssertEqual(FraudEngine.normalizeFR("+33 6 12 34 56 78"), "0612345678")
        XCTAssertEqual(FraudEngine.normalizeFR("0033612345678"), "0612345678")
        XCTAssertEqual(FraudEngine.normalizeFR("06.12.34.56.78"), "0612345678")
    }
}
