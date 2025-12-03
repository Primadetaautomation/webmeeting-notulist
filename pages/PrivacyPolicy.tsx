import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
          <h1>Privacybeleid</h1>
          <p className="text-surface-400 text-sm mb-8">Laatst bijgewerkt: december 2024</p>

          <h2>1. Wie zijn wij?</h2>
          <p>
            Vergader Notulist AI is een dienst van <strong>Prim Automation</strong>, gevestigd in Nederland.
            Wij zijn verantwoordelijk voor de verwerking van uw persoonsgegevens zoals beschreven in dit privacybeleid.
          </p>
          <p>
            <strong>Contact:</strong><br />
            E-mail: <a href="mailto:rick@primautomation.com">rick@primautomation.com</a>
          </p>

          <h2>2. Welke gegevens verzamelen wij?</h2>
          <p>Wij verzamelen en verwerken de volgende gegevens:</p>

          <h3>Accountgegevens</h3>
          <ul>
            <li>E-mailadres (via Google inlog)</li>
            <li>Naam (indien beschikbaar via Google profiel)</li>
            <li>Account ID (anoniem UUID)</li>
          </ul>

          <h3>Opnamegegevens</h3>
          <ul>
            <li>Audio-opnames van uw vergaderingen</li>
            <li>Transcripties (tekst van de opnames)</li>
            <li>Samenvattingen gegenereerd door AI</li>
            <li>Namen van deelnemers (indien u deze invoert)</li>
            <li>Duur van de opname</li>
          </ul>

          <h3>Technische gegevens</h3>
          <ul>
            <li>Sessie-informatie voor inloggen</li>
            <li>Tijdstempels van gebruik</li>
          </ul>

          <h2>3. Waarvoor gebruiken wij uw gegevens?</h2>
          <table className="w-full text-sm border-collapse my-4">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left py-2 text-surface-300">Doel</th>
                <th className="text-left py-2 text-surface-300">Grondslag (AVG)</th>
              </tr>
            </thead>
            <tbody className="text-surface-400">
              <tr className="border-b border-surface-800">
                <td className="py-2">Leveren van de transcriptiedienst</td>
                <td className="py-2">Uitvoering overeenkomst (Art. 6.1.b)</td>
              </tr>
              <tr className="border-b border-surface-800">
                <td className="py-2">Opslaan van uw transcripties</td>
                <td className="py-2">Uitvoering overeenkomst (Art. 6.1.b)</td>
              </tr>
              <tr className="border-b border-surface-800">
                <td className="py-2">Account authenticatie</td>
                <td className="py-2">Uitvoering overeenkomst (Art. 6.1.b)</td>
              </tr>
              <tr className="border-b border-surface-800">
                <td className="py-2">Verbeteren van de dienst</td>
                <td className="py-2">Gerechtvaardigd belang (Art. 6.1.f)</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Met wie delen wij uw gegevens?</h2>
          <p>Wij delen uw gegevens met de volgende partijen voor het leveren van onze dienst:</p>

          <table className="w-full text-sm border-collapse my-4">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left py-2 text-surface-300">Partij</th>
                <th className="text-left py-2 text-surface-300">Doel</th>
                <th className="text-left py-2 text-surface-300">Locatie</th>
              </tr>
            </thead>
            <tbody className="text-surface-400">
              <tr className="border-b border-surface-800">
                <td className="py-2">Google (Gemini AI)</td>
                <td className="py-2">Audio transcriptie en samenvatting</td>
                <td className="py-2">VS (met SCCs)</td>
              </tr>
              <tr className="border-b border-surface-800">
                <td className="py-2">Supabase</td>
                <td className="py-2">Database en bestandsopslag</td>
                <td className="py-2">EU/Canada</td>
              </tr>
              <tr className="border-b border-surface-800">
                <td className="py-2">Google OAuth</td>
                <td className="py-2">Inloggen met Google</td>
                <td className="py-2">VS (met SCCs)</td>
              </tr>
              <tr className="border-b border-surface-800">
                <td className="py-2">Vercel</td>
                <td className="py-2">Website hosting</td>
                <td className="py-2">VS (met SCCs)</td>
              </tr>
            </tbody>
          </table>

          <p>
            <strong>SCCs</strong> = Standard Contractual Clauses, goedgekeurd door de Europese Commissie
            voor internationale datatransfers.
          </p>

          <h2>5. Hoe lang bewaren wij uw gegevens?</h2>
          <ul>
            <li><strong>Transcripties:</strong> Tot u deze verwijdert, of tot u uw account verwijdert</li>
            <li><strong>Audio-opnames:</strong> Worden na verwerking verwijderd (niet permanent opgeslagen)</li>
            <li><strong>Accountgegevens:</strong> Tot u uw account verwijdert</li>
          </ul>
          <p>
            Wanneer u uw account verwijdert, worden al uw gegevens automatisch en permanent verwijderd.
          </p>

          <h2>6. Uw rechten</h2>
          <p>Onder de AVG heeft u de volgende rechten:</p>
          <ul>
            <li><strong>Inzage:</strong> U kunt opvragen welke gegevens wij van u hebben</li>
            <li><strong>Correctie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
            <li><strong>Verwijdering:</strong> U kunt uw gegevens laten verwijderen</li>
            <li><strong>Overdraagbaarheid:</strong> U kunt uw gegevens opvragen in een leesbaar formaat</li>
            <li><strong>Bezwaar:</strong> U kunt bezwaar maken tegen bepaalde verwerkingen</li>
            <li><strong>Beperking:</strong> U kunt de verwerking laten beperken</li>
          </ul>
          <p>
            Om uw rechten uit te oefenen, neem contact op via{' '}
            <a href="mailto:rick@primautomation.com">rick@primautomation.com</a>.
          </p>

          <h2>7. Beveiliging</h2>
          <p>Wij nemen de beveiliging van uw gegevens serieus:</p>
          <ul>
            <li>Alle verbindingen zijn versleuteld (HTTPS/TLS)</li>
            <li>Gegevens worden versleuteld opgeslagen</li>
            <li>Toegang tot gegevens is beperkt tot geautoriseerde gebruikers</li>
            <li>Wij gebruiken Row-Level Security op database niveau</li>
          </ul>

          <h2>8. Cookies en lokale opslag</h2>
          <p>
            Wij gebruiken <strong>geen tracking cookies</strong>. Wel gebruiken wij lokale opslag
            (localStorage) in uw browser voor:
          </p>
          <ul>
            <li>Sessie-informatie om u ingelogd te houden</li>
          </ul>
          <p>Dit is noodzakelijk voor het functioneren van de dienst.</p>

          <h2>9. Opnemen van anderen</h2>
          <p className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <strong>Let op:</strong> Wanneer u vergaderingen opneemt, bent u zelf verantwoordelijk voor
            het informeren van de andere deelnemers. In Nederland is het opnemen van gesprekken waar
            u zelf aan deelneemt toegestaan, maar het is goed gebruik om deelnemers te informeren.
            Onze app biedt hiervoor een optionele audio-melding.
          </p>

          <h2>10. Wijzigingen</h2>
          <p>
            Wij kunnen dit privacybeleid wijzigen. Bij belangrijke wijzigingen zullen wij u informeren
            via de app of per e-mail. De datum bovenaan geeft aan wanneer dit beleid laatst is gewijzigd.
          </p>

          <h2>11. Klachten</h2>
          <p>
            Als u een klacht heeft over hoe wij met uw gegevens omgaan, kunt u contact met ons opnemen.
            U heeft ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens:
          </p>
          <p>
            <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
              autoriteitpersoonsgegevens.nl
            </a>
          </p>

          <div className="mt-12 p-4 bg-surface-800 rounded-lg text-center">
            <p className="text-surface-400 text-sm">
              Vragen over dit privacybeleid?{' '}
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

export default PrivacyPolicy;
