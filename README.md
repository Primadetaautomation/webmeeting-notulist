# Vergader Notulist AI

**Neem Teams, Google Meet of Zoom gesprekken op en krijg direct een transcriptie en samenvatting met AI.**

![Vergader Notulist](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Functies

- **Audio opname** - Neemt zowel je microfoon als systeemgeluid op (inclusief meeting audio)
- **AI Transcriptie** - Automatische transcriptie met Gemini 2.5 Flash
- **Slimme samenvatting** - Krijg een samenvatting met belangrijkste punten en actiepunten
- **Speaker labels** - Herkent verschillende sprekers in het gesprek
- **Opname notificatie** - Optionele audio melding voor deelnemers
- **Cloud opslag** - Transcripties worden veilig opgeslagen in je account
- **Google login** - Eenvoudig inloggen met je Google account

---

## Installatie

### Vereisten

- [Node.js](https://nodejs.org/) v18 of hoger
- [Git](https://git-scm.com/)
- Een [Supabase](https://supabase.com/) account (gratis)
- Een [Google Cloud](https://console.cloud.google.com/) account (voor Gemini API)

---

### Stap 1: Repository clonen

```bash
git clone https://github.com/Primadetaautomation/webmeeting-notulist.git
cd webmeeting-notulist
npm install
```

---

### Stap 2: Supabase instellen

#### 2.1 Project aanmaken

1. Ga naar [supabase.com](https://supabase.com/) en maak een account
2. Klik op **"New Project"**
3. Kies een naam en wachtwoord
4. Wacht tot het project is aangemaakt (~2 minuten)

#### 2.2 Database tabellen aanmaken

Ga naar **SQL Editor** in je Supabase dashboard en voer dit uit:

```sql
-- Transcriptions tabel
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  audio_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security aanzetten
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Gebruikers kunnen alleen hun eigen transcripties zien
CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Gebruikers kunnen alleen eigen transcripties aanmaken
CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Gebruikers kunnen alleen eigen transcripties updaten
CREATE POLICY "Users can update own transcriptions"
  ON transcriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Gebruikers kunnen alleen eigen transcripties verwijderen
CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Index voor snellere queries
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
```

#### 2.3 Storage bucket aanmaken

1. Ga naar **Storage** in Supabase
2. Klik op **"New Bucket"**
3. Naam: `recordings`
4. Zet **Public bucket** UIT (PRIVATE voor beveiliging)
5. Klik **Create bucket**
6. Run de storage policies migration:
```sql
-- Voer supabase/migrations/002_storage_policies.sql uit in de SQL Editor
```

#### 2.4 Google OAuth configureren

1. Ga naar **Authentication** → **Providers**
2. Klik op **Google**
3. Zet de toggle **AAN**
4. Je hebt een **Client ID** en **Client Secret** nodig (zie Stap 3)

---

### Stap 3: Google Cloud instellen

#### 3.1 Gemini API Key aanmaken

1. Ga naar [Google AI Studio](https://aistudio.google.com/apikey)
2. Klik op **"Create API Key"**
3. Kopieer de API key

#### 3.2 OAuth Credentials aanmaken (voor Google login)

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project of selecteer een bestaand project
3. Ga naar **APIs & Services** → **OAuth consent screen**
4. Kies **External** en klik **Create**
5. Vul in:
   - App name: `Vergader Notulist`
   - User support email: jouw email
   - Developer contact: jouw email
6. Klik **Save and Continue** (sla scopes over)
7. Bij **Test users**: voeg je eigen email toe (of publiceer de app)
8. Ga naar **APIs & Services** → **Credentials**
9. Klik **Create Credentials** → **OAuth client ID**
10. Kies **Web application**
11. Voeg toe bij **Authorized redirect URIs**:
    ```
    https://YOUR-PROJECT.supabase.co/auth/v1/callback
    ```
    (vervang YOUR-PROJECT met je Supabase project ID)
12. Kopieer de **Client ID** en **Client Secret**
13. Voer deze in bij Supabase (Authentication → Providers → Google)

---

### Stap 4: Environment variables instellen

Maak een `.env` bestand in de root van het project:

```bash
# Supabase (vind deze in Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API Key
API_KEY=your-gemini-api-key-here
```

**Waar vind je deze waarden?**

| Variabele | Locatie |
|-----------|---------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

---

### Stap 5: Lokaal draaien

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in je browser.

---

## Deployen naar Vercel

### Optie 1: Via Vercel Dashboard

1. Ga naar [vercel.com](https://vercel.com/) en log in met GitHub
2. Klik **"Add New Project"**
3. Importeer je repository
4. Voeg Environment Variables toe:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `API_KEY`
5. Klik **Deploy**

### Optie 2: Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Na deployment

1. Kopieer je Vercel URL (bijv. `https://vergader-notulist.vercel.app`)
2. Voeg deze toe aan Google Cloud OAuth **Authorized redirect URIs**:
   ```
   https://YOUR-PROJECT.supabase.co/auth/v1/callback
   ```
3. Voeg de URL toe aan Supabase **Authentication** → **URL Configuration** → **Site URL**

---

## Gebruik

### Een vergadering opnemen

1. **Log in** met je Google account
2. **Zet "Deelnemers informeren" aan** (optioneel) - speelt een audio melding af
3. **Klik "Start Opname"**
4. In de browser popup:
   - Kies **"Hele scherm"** of **"Tabblad"** (niet Venster!)
   - Vink **"Systeemgeluid delen"** AAN (linksonder)
   - Klik **Delen**
5. **Start je meeting** (Teams, Google Meet, Zoom, etc.)
6. **Klik "Stop Opname"** wanneer je klaar bent
7. **Klik "Transcribeer met AI"** om de transcriptie te genereren
8. De transcriptie wordt automatisch opgeslagen in je account

### Tips

- Gebruik **Chrome of Edge** voor de beste ondersteuning
- Zorg dat je **oortjes of headset** gebruikt voor betere audio kwaliteit
- De transcriptie werkt het beste bij **duidelijke spraak** en **weinig achtergrondgeluid**

---

## Veelgestelde vragen

### "Systeemgeluid delen" optie verschijnt niet

- Gebruik Chrome of Edge (Firefox ondersteunt dit niet)
- Kies "Hele scherm" of "Tabblad", niet "Venster"
- Op macOS: geef Chrome toestemming in Systeemvoorkeuren → Privacy → Schermopname

### "Supabase niet geconfigureerd" fout

- Controleer of `.env` bestand bestaat
- Controleer of de Supabase URL en Key correct zijn
- Herstart de development server na wijzigingen

### Google login werkt niet

1. Controleer of OAuth consent screen op **External** staat
2. Controleer of je email is toegevoegd als **Test user** (of publiceer de app)
3. Controleer of de **redirect URI** correct is ingesteld

### Transcriptie duurt lang

- Lange opnames (>30 min) kunnen 1-2 minuten duren
- Check je internetverbinding
- Gemini API heeft soms vertragingen bij piekuren

---

## Technische stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash
- **Auth**: Supabase Auth met Google OAuth

---

## Licentie

MIT License - Vrij te gebruiken en aan te passen.

---

## Support

Problemen of vragen? [Open een issue](https://github.com/Primadetaautomation/webmeeting-notulist/issues) op GitHub.
