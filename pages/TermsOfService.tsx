import React from 'react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-surface-900 text-surface-100">
      {/* Header */}
      <header className="glass border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Terug
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose-custom">
          <h1>Gebruiksvoorwaarden</h1>
          <p className="text-surface-400 text-sm mb-8">Laatst bijgewerkt: december 2024</p>

          <h2>1. Aanvaarding van de voorwaarden</h2>
          <p>
            Door gebruik te maken van Vergader Notulist AI ("de Dienst") gaat u akkoord met deze
            gebruiksvoorwaarden. Als u niet akkoord gaat, gebruik de Dienst dan niet.
          </p>

          <h2>2. Beschrijving van de Dienst</h2>
          <p>
            Vergader Notulist AI is een online tool waarmee u:
          </p>
          <ul>
            <li>Audio van vergaderingen kunt opnemen via uw browser</li>
            <li>Automatisch transcripties kunt laten maken met AI</li>
            <li>Samenvattingen kunt genereren van uw vergaderingen</li>
            <li>Uw transcripties kunt opslaan en beheren</li>
          </ul>

          <h2>3. Account en toegang</h2>
          <h3>3.1 Registratie</h3>
          <p>
            Om de Dienst te gebruiken moet u inloggen met een Google-account. U bent verantwoordelijk
            voor het geheim houden van uw accountgegevens.
          </p>

          <h3>3.2 Accountbeveiliging</h3>
          <p>
            U bent verantwoordelijk voor alle activiteiten die plaatsvinden onder uw account.
            Meld ongeautoriseerd gebruik direct aan ons.
          </p>

          <h2>4. Acceptabel gebruik</h2>
          <p>U gaat ermee akkoord dat u de Dienst <strong>niet</strong> zult gebruiken voor:</p>
          <ul>
            <li>Illegale activiteiten of activiteiten die de wet overtreden</li>
            <li>Het opnemen van gesprekken zonder medeweten van deelnemers waar dit wettelijk vereist is</li>
            <li>Het verspreiden van schadelijke, bedreigende of discriminerende content</li>
            <li>Het verstoren of overbelasten van onze systemen</li>
            <li>Het omzeilen van beveiligingsmaatregelen</li>
            <li>Het verzamelen van gegevens van andere gebruikers</li>
          </ul>

          <h2>5. Verantwoordelijkheid bij opnames</h2>
          <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg my-4">
            <p className="mb-2">
              <strong>Belangrijk:</strong> U bent zelf verantwoordelijk voor het naleven van wet- en
              regelgeving bij het opnemen van gesprekken.
            </p>
            <ul className="text-sm">
              <li>Informeer deelnemers dat u opneemt (onze app biedt hiervoor een optie)</li>
              <li>Respecteer de privacy van anderen</li>
              <li>Gebruik opnames niet voor ongeoorloofde doeleinden</li>
            </ul>
          </div>

          <h2>6. Intellectueel eigendom</h2>
          <h3>6.1 Onze rechten</h3>
          <p>
            De Dienst, inclusief alle software, ontwerp en documentatie, is eigendom van
            Prim Automation en is beschermd door intellectuele eigendomsrechten.
          </p>

          <h3>6.2 Uw content</h3>
          <p>
            U behoudt alle rechten op de content die u uploadt (audio, transcripties).
            Door de Dienst te gebruiken, geeft u ons een beperkte licentie om uw content te
            verwerken voor het leveren van de Dienst.
          </p>

          <h2>7. Beschikbaarheid en wijzigingen</h2>
          <p>
            Wij streven naar een hoge beschikbaarheid, maar kunnen niet garanderen dat de Dienst
            altijd beschikbaar is. Wij behouden ons het recht voor om:
          </p>
          <ul>
            <li>De Dienst tijdelijk te onderbreken voor onderhoud</li>
            <li>Functies te wijzigen of toe te voegen</li>
            <li>De Dienst te beëindigen met redelijke vooraankondiging</li>
          </ul>

          <h2>8. Beperking van aansprakelijkheid</h2>
          <p>
            Voor zover wettelijk toegestaan:
          </p>
          <ul>
            <li>
              De Dienst wordt geleverd "as is" zonder garanties van welke aard dan ook
            </li>
            <li>
              Wij zijn niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst
            </li>
            <li>
              Onze totale aansprakelijkheid is beperkt tot het bedrag dat u in de afgelopen
              12 maanden aan ons heeft betaald (indien van toepassing)
            </li>
          </ul>

          <h2>9. AI-gegenereerde content</h2>
          <p>
            De transcripties en samenvattingen worden gegenereerd door AI (Google Gemini).
            Hoewel wij streven naar nauwkeurigheid:
          </p>
          <ul>
            <li>Kunnen er fouten in de transcripties voorkomen</li>
            <li>Is de AI-output niet 100% betrouwbaar</li>
            <li>Moet u belangrijke informatie altijd verifiëren</li>
          </ul>
          <p>
            Wij zijn niet aansprakelijk voor beslissingen genomen op basis van AI-gegenereerde content.
          </p>

          <h2>10. Beëindiging</h2>
          <p>
            Wij kunnen uw toegang tot de Dienst beëindigen als u deze voorwaarden schendt.
            U kunt uw account op elk moment verwijderen. Bij beëindiging:
          </p>
          <ul>
            <li>Worden al uw gegevens permanent verwijderd</li>
            <li>Verliest u toegang tot opgeslagen transcripties</li>
          </ul>

          <h2>11. Wijzigingen in deze voorwaarden</h2>
          <p>
            Wij kunnen deze voorwaarden wijzigen. Bij belangrijke wijzigingen informeren wij u
            via de app of per e-mail. Voortgezet gebruik na wijzigingen betekent dat u de
            nieuwe voorwaarden accepteert.
          </p>

          <h2>12. Toepasselijk recht</h2>
          <p>
            Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd
            aan de bevoegde rechter in Nederland.
          </p>

          <h2>13. Contact</h2>
          <p>
            Voor vragen over deze voorwaarden kunt u contact opnemen via:
          </p>
          <p>
            <strong>Prim Automation</strong><br />
            E-mail: <a href="mailto:rick@primautomation.com">rick@primautomation.com</a>
          </p>

          <h2>14. Overige bepalingen</h2>
          <ul>
            <li>
              <strong>Scheidbaarheid:</strong> Als een bepaling ongeldig is, blijven de overige
              bepalingen van kracht.
            </li>
            <li>
              <strong>Volledige overeenkomst:</strong> Deze voorwaarden vormen de volledige
              overeenkomst tussen u en ons.
            </li>
            <li>
              <strong>Geen afstand:</strong> Het niet afdwingen van een recht betekent niet dat
              wij afstand doen van dat recht.
            </li>
          </ul>

          <div className="mt-12 p-4 bg-surface-800 rounded-lg text-center">
            <p className="text-surface-400 text-sm">
              Vragen over deze voorwaarden?{' '}
              <a href="mailto:rick@primautomation.com" className="text-primary-400">
                Neem contact op
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
