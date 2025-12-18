/**
 * Audio Chunking Service
 * Splits long audio recordings into smaller chunks for reliable transcription
 */

export interface AudioChunk {
  index: number;
  blob: Blob;
  startTime: number; // in seconds
  endTime: number;   // in seconds
}

// Default chunk duration: 3 minutes (180 seconds)
const DEFAULT_CHUNK_DURATION_MS = 180000;

/**
 * Groups raw MediaRecorder chunks (typically 1 second each) into larger chunks
 * suitable for transcription (e.g., 3 minutes each)
 */
export function groupChunksForTranscription(
  rawChunks: Blob[],
  mimeType: string,
  chunkDurationMs: number = DEFAULT_CHUNK_DURATION_MS,
  rawChunkIntervalMs: number = 1000 // MediaRecorder interval
): AudioChunk[] {
  if (rawChunks.length === 0) {
    return [];
  }

  const chunksPerSegment = Math.ceil(chunkDurationMs / rawChunkIntervalMs);
  const result: AudioChunk[] = [];

  for (let i = 0; i < rawChunks.length; i += chunksPerSegment) {
    const segmentChunks = rawChunks.slice(i, i + chunksPerSegment);
    const blob = new Blob(segmentChunks, { type: mimeType });

    const startTime = (i * rawChunkIntervalMs) / 1000;
    const endTime = Math.min(
      ((i + segmentChunks.length) * rawChunkIntervalMs) / 1000,
      (rawChunks.length * rawChunkIntervalMs) / 1000
    );

    result.push({
      index: result.length,
      blob,
      startTime,
      endTime
    });
  }

  return result;
}

/**
 * Formats time in seconds to MM:SS format
 */
export function formatTimeRange(startSec: number, endSec: number): string {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return `${formatTime(startSec)} - ${formatTime(endSec)}`;
}

/**
 * Combines multiple transcription results into one coherent document
 */
export function combineTranscriptions(
  transcriptions: { text: string; timeRange: string }[]
): string {
  if (transcriptions.length === 0) {
    return '';
  }

  if (transcriptions.length === 1) {
    return transcriptions[0].text;
  }

  // For multiple chunks, we need to intelligently combine them
  // Strategy: Keep full content, but avoid duplicate headers

  const sections = {
    transcription: [] as string[],
    summary: [] as string[],
    actionItems: [] as string[],
    decisions: [] as string[],
    participants: new Set<string>()
  };

  for (const { text, timeRange } of transcriptions) {
    // Parse each transcription and extract sections
    const parsed = parseTranscription(text);

    // Add time marker to transcription
    if (parsed.transcription) {
      sections.transcription.push(`\n**[${timeRange}]**\n${parsed.transcription}`);
    }

    if (parsed.summary) {
      sections.summary.push(parsed.summary);
    }

    if (parsed.actionItems.length > 0) {
      sections.actionItems.push(...parsed.actionItems);
    }

    if (parsed.decisions.length > 0) {
      sections.decisions.push(...parsed.decisions);
    }

    parsed.participants.forEach(p => sections.participants.add(p));
  }

  // Build combined document
  let result = '### Transcriptie\n';
  result += sections.transcription.join('\n');

  result += '\n\n---\n\n## Samenvatting\n';
  result += sections.summary.join(' ');

  if (sections.actionItems.length > 0) {
    result += '\n\n## Actiepunten\n';
    // Deduplicate action items
    const uniqueActions = [...new Set(sections.actionItems)];
    result += uniqueActions.map(a => `- [ ] ${a}`).join('\n');
  }

  if (sections.decisions.length > 0) {
    result += '\n\n## Beslissingen\n';
    const uniqueDecisions = [...new Set(sections.decisions)];
    result += uniqueDecisions.map(d => `- ${d}`).join('\n');
  }

  if (sections.participants.size > 0) {
    result += '\n\n## Deelnemers\n';
    result += [...sections.participants].map(p => `- ${p}`).join('\n');
  }

  result += '\n\n---\n*Transcriptie gegenereerd door Vergader Notulist AI*';

  return result;
}

/**
 * Parses a transcription into its component sections
 */
function parseTranscription(text: string): {
  transcription: string;
  summary: string;
  actionItems: string[];
  decisions: string[];
  participants: string[];
} {
  const result = {
    transcription: '',
    summary: '',
    actionItems: [] as string[],
    decisions: [] as string[],
    participants: [] as string[]
  };

  // Split by common section headers
  const transcriptionMatch = text.match(/###?\s*Transcripti(?:e|on)\s*([\s\S]*?)(?=\n---|\n##|$)/i);
  if (transcriptionMatch) {
    result.transcription = transcriptionMatch[1].trim();
  }

  const summaryMatch = text.match(/##\s*Samenvatting|##\s*Summary\s*([\s\S]*?)(?=\n##|$)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1]?.trim() || '';
  }

  const actionMatch = text.match(/##\s*Actiepunten|##\s*Action Items\s*([\s\S]*?)(?=\n##|$)/i);
  if (actionMatch) {
    const items = actionMatch[1]?.match(/[-\[]\s*\]?\s*(.+)/g) || [];
    result.actionItems = items.map(i => i.replace(/^[-\[]\s*\]?\s*/, '').trim());
  }

  const decisionsMatch = text.match(/##\s*Beslissingen|##\s*Decisions\s*([\s\S]*?)(?=\n##|$)/i);
  if (decisionsMatch) {
    const items = decisionsMatch[1]?.match(/-\s*(.+)/g) || [];
    result.decisions = items.map(i => i.replace(/^-\s*/, '').trim());
  }

  const participantsMatch = text.match(/##\s*Deelnemers|##\s*Participants\s*([\s\S]*?)(?=\n##|\n---|$)/i);
  if (participantsMatch) {
    const items = participantsMatch[1]?.match(/-\s*(.+)/g) || [];
    result.participants = items.map(i => i.replace(/^-\s*/, '').trim());
  }

  return result;
}
