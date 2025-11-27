# Participant Configuration for Speaker Diarization

## Summary

Add the ability for users to configure the number and names of meeting participants before recording. This improves speaker diarization accuracy by giving Gemini explicit information about expected speakers.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI location | Inline in Recorder | Keeps simple flow, no extra screens |
| Input method | Count dropdown → name fields | Intuitive, count helps diarization |
| Own name | Configurable | Better for sharing notes with others |
| Empty fields | Fallback to "Spreker X" | Flexible, count still helps Gemini |
| Persistence | None (fresh each time) | YAGNI, most meetings have different participants |

## UI Design

```
┌─────────────────────────────────────────┐
│  👥 Deelnemers                          │
│                                         │
│  Aantal deelnemers (incl. jezelf):      │
│  ┌─────────────────────────────────┐    │
│  │  3                          ▼   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  1. ┌─────────────────────────────┐     │
│     │ James (jij)                 │     │
│     └─────────────────────────────┘     │
│  2. ┌─────────────────────────────┐     │
│     │ Peter                       │     │
│     └─────────────────────────────┘     │
│  3. ┌─────────────────────────────┐     │
│     │                             │     │
│     └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

- Dropdown: 2-10 participants
- First field has "(jij)" hint
- Empty fields become "Spreker X" in transcript

## Data Structure

```typescript
interface Participant {
  index: number;
  name: string;
  isRecorder: boolean;
}
```

## API Changes

POST `/api/transcribe` receives new optional parameter:

```typescript
{
  audioFileUrl: string;
  participants?: Participant[];
}
```

## Gemini Prompt Addition

When participants are provided, add to prompt:

```
## DEELNEMERS INFORMATIE
Er zijn {count} deelnemers in dit gesprek:
- "{name1}" (de opnemer, LINKER kanaal)
- "{name2}" (RECHTER kanaal)
- "Spreker 3" (RECHTER kanaal, naam onbekend)

Gebruik deze exacte namen als speaker labels.
Het aantal unieke stemmen op het RECHTER kanaal is maximaal {count - 1}.
```

## Files to Modify

| File | Change |
|------|--------|
| `types/types.ts` | Add `Participant` interface |
| `components/Recorder.tsx` | Add participant UI + state |
| `api/transcribe.ts` | Accept participants, update prompt |
| `services/geminiService.ts` | Client-side fallback |

## Backward Compatibility

If `participants` is not provided, existing automatic detection continues to work.
