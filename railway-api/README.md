# Vergader Notulist API - Railway Deployment

Standalone API server voor lange audio transcripties (geen timeout limiet).

## Snelle Deploy naar Railway

### 1. Railway Project aanmaken

```bash
# In de railway-api folder
cd railway-api

# Login bij Railway (als je dat nog niet hebt gedaan)
railway login

# Nieuw project aanmaken
railway init
```

### 2. Environment Variables instellen

Ga naar je Railway dashboard en voeg toe:

| Variable | Waarde |
|----------|--------|
| `API_KEY` | Je Gemini API key |

### 3. Deploy

```bash
railway up
```

Of koppel aan GitHub voor automatische deploys:
1. Ga naar Railway dashboard → Settings → Connect GitHub
2. Selecteer deze repository
3. Set "Root Directory" naar `railway-api`

### 4. Domain instellen

1. Railway dashboard → Settings → Domains
2. Klik "Generate Domain"
3. Kopieer de URL (bijv. `https://vergader-api-production.up.railway.app`)

### 5. Frontend configureren

Voeg in Vercel toe (of lokaal in `.env`):

```
VITE_API_URL=https://jouw-railway-url.railway.app
```

## Lokaal testen

```bash
cd railway-api
npm install
API_KEY=your-key npm run dev
```

Test met:
```bash
curl http://localhost:3001/health
```

## Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/health` | GET | Health check |
| `/api/transcribe` | POST | Audio transcriptie |

## Kosten

Railway: ~$5/maand voor licht gebruik. Geen timeout limiet op betaalde plan.
