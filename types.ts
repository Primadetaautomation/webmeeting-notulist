export interface TranscriptionResult {
  text: string;
}

export enum RecordingState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}