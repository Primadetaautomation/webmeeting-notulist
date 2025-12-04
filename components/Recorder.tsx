import React, { useState, useRef, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { RecordingState, Participant } from '../types';
import { processAudioRecording, transcribeAudioDirect } from '../services/geminiService';
import AudioVisualizer from './AudioVisualizer';
import ReactMarkdown from 'react-markdown';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
);

interface RecorderProps {
  onSave?: (content: string, durationSeconds?: number) => Promise<void>;
}

// Bell/Notification Icon
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

// Users Icon
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

// Globe Icon for language
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const Recorder: React.FC<RecorderProps> = ({ onSave }) => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<RecordingState>(RecordingState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [mixedStream, setMixedStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [notifyParticipants, setNotifyParticipants] = useState<boolean>(false);

  // Transcription language (separate from UI language)
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<'en' | 'nl'>('nl');

  // Participant configuration for speaker diarization
  const [participantCount, setParticipantCount] = useState<number>(2);
  const [participants, setParticipants] = useState<Participant[]>([
    { index: 1, name: '', isRecorder: true },
    { index: 2, name: '', isRecorder: false }
  ]);

  // Refs for managing audio context and streams
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

  /**
   * Play audio notification to inform participants about the recording
   * Uses Web Speech Synthesis API for cross-platform compatibility
   */
  const playRecordingNotification = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!notifyParticipants) {
        resolve();
        return;
      }

      // Use Speech Synthesis for the notification
      if ('speechSynthesis' in window) {
        const message = t('notificationAudio.message');
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = transcriptionLanguage === 'nl' ? 'nl-NL' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve(); // Continue even if speech fails

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: just resolve if speech synthesis not available
        console.warn('Speech synthesis not available');
        resolve();
      }
    });
  }, [notifyParticipants, transcriptionLanguage, t]);

  const stopStreams = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
    setMixedStream(null);
  }, []);

  // Handle participant count change
  const handleParticipantCountChange = useCallback((newCount: number) => {
    setParticipantCount(newCount);
    setParticipants(prev => {
      const newParticipants: Participant[] = [];
      for (let i = 1; i <= newCount; i++) {
        const existing = prev.find(p => p.index === i);
        newParticipants.push({
          index: i,
          name: existing?.name || '',
          isRecorder: i === 1
        });
      }
      return newParticipants;
    });
  }, []);

  // Handle participant name change
  const handleParticipantNameChange = useCallback((index: number, name: string) => {
    setParticipants(prev => prev.map(p =>
      p.index === index ? { ...p, name } : p
    ));
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscription(null);
    chunksRef.current = [];
    setUploadProgress("");

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const destination = ctx.createMediaStreamDestination();
      destination.channelCount = 2;

      const merger = ctx.createChannelMerger(2);

      // Get Microphone Stream
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        micStreamRef.current = micStream;
        const micSource = ctx.createMediaStreamSource(micStream);
        micSource.connect(merger, 0, 0);
      } catch (err) {
        throw new Error(t('errors.microphoneAccess'));
      }

      // Get System Audio (via Screen Share)
      let screenStream: MediaStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
          // @ts-ignore
          systemAudio: 'include',
          selfBrowserSurface: 'include'
        });
        screenStreamRef.current = screenStream;
      } catch (err) {
        throw new Error(t('errors.recordingCancelled'));
      }

      const sysAudioTrack = screenStream.getAudioTracks()[0];
      if (!sysAudioTrack) {
        stopStreams();
        throw new Error(t('errors.noSystemAudio'));
      }

      const sysSource = ctx.createMediaStreamSource(screenStream);
      sysSource.connect(merger, 0, 1);
      merger.connect(destination);

      const combinedStream = destination.stream;
      setMixedStream(combinedStream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);

        // Calculate recording duration
        if (recordingStartTimeRef.current) {
          const durationMs = Date.now() - recordingStartTimeRef.current;
          setRecordingDuration(Math.round(durationMs / 1000));
          recordingStartTimeRef.current = null;
        }

        stopStreams();
        setStatus(RecordingState.COMPLETED);
      };

      sysAudioTrack.onended = () => stopRecording();

      recorder.start(1000);
      recordingStartTimeRef.current = Date.now();
      setStatus(RecordingState.RECORDING);

      // Play notification after recording starts (so it's captured in the recording)
      playRecordingNotification();

    } catch (err: any) {
      console.error(err);
      stopStreams();
      setErrorMsg(err.message || t('errors.unknownError'));
      setStatus(RecordingState.ERROR);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleTranscribe = async () => {
    if (!recordedBlob) return;

    setStatus(RecordingState.PROCESSING);
    setUploadProgress(t('recorder.uploadingToServer'));
    setSaved(false);

    try {
      let text: string;
      if (process.env.VITE_SUPABASE_URL) {
        text = await processAudioRecording(recordedBlob, participants, transcriptionLanguage);
      } else {
        setUploadProgress(t('recorder.localProcessing'));
        text = await transcribeAudioDirect(recordedBlob, participants, transcriptionLanguage);
      }

      setTranscription(text);
      setStatus(RecordingState.COMPLETED);
      setUploadProgress("");

      // Auto-save transcription if onSave prop is provided
      if (onSave && text) {
        try {
          setUploadProgress(t('recorder.saving'));
          await onSave(text, recordingDuration > 0 ? recordingDuration : undefined);
          setSaved(true);
          setUploadProgress("");
        } catch (saveErr) {
          console.error('Failed to auto-save transcription:', saveErr);
          // Don't set error - transcription succeeded, just save failed
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(t('errors.transcriptionError', { message: err.message }));
      setStatus(RecordingState.ERROR);
      setUploadProgress("");
    }
  };

  const reset = () => {
    setStatus(RecordingState.IDLE);
    setTranscription(null);
    setRecordedBlob(null);
    setErrorMsg(null);
    setUploadProgress("");
    setSaved(false);
    setRecordingDuration(0);
  };

  const copyToClipboard = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadAsMarkdown = () => {
    if (transcription) {
      const blob = new Blob([transcription], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">

      {/* Instructions Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-accent-400 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center text-accent-400">?</span>
          {t('recorder.howItWorks')}
        </h2>

        {/* Browser-based meetings */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-surface-200 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary-500/20 rounded flex items-center justify-center text-primary-400 text-xs">🌐</span>
            {t('recorder.browserMeetings')}
          </h3>
          <ol className="space-y-2 text-sm ml-7">
            {[
              { step: 1, textKey: 'recorder.step1' },
              { step: 2, textKey: 'recorder.step2' },
              { step: 3, textKey: 'recorder.step3' },
              { step: 4, textKey: 'recorder.step4' },
            ].map(({ step, textKey }) => (
              <li key={step} className="flex items-start gap-3 text-surface-300">
                <span className="flex-shrink-0 w-5 h-5 bg-surface-700 rounded-full flex items-center justify-center text-xs font-bold text-surface-400">
                  {step}
                </span>
                <span className="pt-0.5">
                  <Trans i18nKey={textKey}>
                    Step text with <span className="text-white font-medium">highlighted</span> parts
                  </Trans>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Desktop app meetings */}
        <div className="p-4 bg-surface-700/50 rounded-lg border border-surface-600">
          <h3 className="text-sm font-medium text-surface-200 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-accent-500/20 rounded flex items-center justify-center text-accent-400 text-xs">💻</span>
            {t('recorder.desktopMeetings')}
          </h3>
          <div className="space-y-3 text-sm text-surface-300">
            <p>
              <Trans i18nKey="recorder.desktopInstructions">
                If you use Teams or Zoom via the <span className="text-accent-400 font-medium">desktop app</span>:
              </Trans>
            </p>
            <ol className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-accent-400 font-bold">1.</span>
                <span>
                  <Trans i18nKey="recorder.desktopStep1">
                    Click <span className="text-white font-medium">Start Recording</span> and choose <span className="text-accent-400 font-medium">Entire screen</span>
                  </Trans>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-400 font-bold">2.</span>
                <span>
                  <Trans i18nKey="recorder.desktopStep2">
                    Check <span className="text-success-400 font-medium">Share system audio</span> ON
                  </Trans>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-400 font-bold">3.</span>
                <span>
                  <Trans i18nKey="recorder.desktopStep3">
                    Make sure you use <span className="text-white font-medium">speakers</span> (not earbuds!)
                  </Trans>
                </span>
              </li>
            </ol>
            <div className="mt-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <p className="text-primary-300 text-xs">
                <span className="font-semibold">💡 Tip:</span> {t('recorder.desktopTip')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Language Selector */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center text-accent-400">
              <GlobeIcon />
            </div>
            <div>
              <span className="text-sm font-medium text-surface-200">{t('recorder.transcriptionLanguage')}</span>
              <p className="text-xs text-surface-500">
                {t('recorder.transcriptionLanguageDesc')}
              </p>
            </div>
          </div>
          <select
            value={transcriptionLanguage}
            onChange={(e) => setTranscriptionLanguage(e.target.value as 'en' | 'nl')}
            className="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
          >
            <option value="nl">{t('languages.nl')}</option>
            <option value="en">{t('languages.en')}</option>
          </select>
        </div>
      </div>

      {/* Participant Configuration */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center text-accent-400">
            <UsersIcon />
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-200">{t('recorder.participants')}</h3>
            <p className="text-xs text-surface-500">
              {t('recorder.participantsDesc')}
            </p>
          </div>
        </div>

        {/* Participant count selector */}
        <div className="mb-4">
          <label className="block text-xs text-surface-400 mb-2">
            {t('recorder.participantCount')}
          </label>
          <select
            value={participantCount}
            onChange={(e) => handleParticipantCountChange(Number(e.target.value))}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {/* Participant name inputs */}
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.index} className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-surface-700 rounded-full flex items-center justify-center text-xs font-bold text-surface-400">
                {participant.index}
              </span>
              <input
                type="text"
                value={participant.name}
                onChange={(e) => handleParticipantNameChange(participant.index, e.target.value)}
                placeholder={participant.isRecorder ? t('recorder.yourName') : t('recorder.participantPlaceholder', { index: participant.index })}
                className="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
              />
              {participant.isRecorder && (
                <span className="text-xs text-accent-400 flex-shrink-0">{t('recorder.you')}</span>
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-surface-500">
          {t('recorder.participantsNote')}
        </p>
      </div>

      {/* Recording Notification Toggle */}
      <div className="card p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400">
              <BellIcon />
            </div>
            <div>
              <span className="text-sm font-medium text-surface-200">{t('recorder.notifyParticipants')}</span>
              <p className="text-xs text-surface-500">
                {t('recorder.notifyDesc')}
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={notifyParticipants}
              onChange={(e) => setNotifyParticipants(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </div>
        </label>
      </div>

      {/* Main Recording Card */}
      <div className="card p-8">
        {/* Audio Visualizer */}
        <div className="relative mb-6">
          <AudioVisualizer stream={mixedStream} isRecording={status === RecordingState.RECORDING} />
          {status === RecordingState.RECORDING && (
            <div className="absolute top-3 right-3 recording-indicator">
              <span className="recording-dot" />
              <span className="text-xs font-mono text-error-200 uppercase tracking-wider">{t('recorder.recording')}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          {status === RecordingState.IDLE || status === RecordingState.ERROR || (status === RecordingState.COMPLETED && !transcription) ? (
            <button onClick={startRecording} className="btn-primary">
              <MicIcon />
              <span>{recordedBlob ? t('recorder.newRecording') : t('recorder.startRecording')}</span>
            </button>
          ) : status === RecordingState.RECORDING ? (
            <button onClick={stopRecording} className="btn-danger">
              <StopIcon />
              <span>{t('recorder.stopRecording')}</span>
            </button>
          ) : null}

          {/* Error Message */}
          {errorMsg && (
            <div className="w-full max-w-md bg-error-500/10 border border-error-500/30 rounded-lg p-4 text-center">
              <p className="text-error-300 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Recording Completed - Show Transcribe Button */}
          {recordedBlob && status !== RecordingState.RECORDING && !transcription && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <p className="text-surface-400 text-sm">
                {t('recorder.recordingComplete', { size: Math.round(recordedBlob.size / 1024) })}
                {recordingDuration > 0 && (
                  <span className="ml-2">
                    - {t('recorder.duration', {
                      minutes: Math.floor(recordingDuration / 60),
                      seconds: (recordingDuration % 60).toString().padStart(2, '0')
                    })}
                  </span>
                )}
              </p>
              <button
                onClick={handleTranscribe}
                disabled={status === RecordingState.PROCESSING}
                className="btn-success"
              >
                {status === RecordingState.PROCESSING ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{uploadProgress || t('recorder.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    <span>{t('recorder.transcribeWithAI')}</span>
                  </>
                )}
              </button>
              {status === RecordingState.PROCESSING && (
                <p className="text-xs text-surface-500 animate-pulse">
                  {t('recorder.processingTime')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transcription Result */}
      {transcription && (
        <div className="card animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-success-400 flex items-center gap-2">
                <CheckIcon />
                {t('recorder.transcriptionSummary')}
              </h3>
              {saved && (
                <span className="badge-primary flex items-center gap-1">
                  <SaveIcon />
                  <span>{t('recorder.saved')}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="btn-ghost"
                title={t('recorder.copyToClipboard')}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span className="hidden sm:inline">{copied ? t('recorder.copied') : t('recorder.copy')}</span>
              </button>
              <button
                onClick={downloadAsMarkdown}
                className="btn-ghost"
                title={t('recorder.downloadAsMarkdown')}
              >
                <DownloadIcon />
                <span className="hidden sm:inline">{t('recorder.download')}</span>
              </button>
              <button
                onClick={reset}
                className="btn-ghost"
                title={t('recorder.startOver')}
              >
                <RefreshIcon />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto scrollbar-custom">
            <div className="prose-custom">
              <ReactMarkdown>{transcription}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recorder;
