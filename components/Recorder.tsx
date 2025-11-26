import React, { useState, useRef, useCallback } from 'react';
import { RecordingState } from '../types';
import { processAudioRecording, transcribeAudioDirect } from '../services/geminiService';
import AudioVisualizer from './AudioVisualizer';
import ReactMarkdown from 'react-markdown';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const Recorder: React.FC = () => {
  const [status, setStatus] = useState<RecordingState>(RecordingState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [mixedStream, setMixedStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Refs for managing audio context and streams
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscription(null);
    chunksRef.current = [];
    setUploadProgress("");

    try {
      // 1. Setup Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const destination = ctx.createMediaStreamDestination();
      destination.channelCount = 2; 

      const merger = ctx.createChannelMerger(2);

      // 2. Get Microphone Stream
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
        throw new Error("Geen toegang tot microfoon. Controleer je browser instellingen.");
      }

      // 3. Get System Audio (via Screen Share)
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
        throw new Error("Opname geannuleerd. Je MOET 'Systeemgeluid delen' (of Audio delen) aanvinken in het scherm-deel venster.");
      }

      const sysAudioTrack = screenStream.getAudioTracks()[0];
      if (!sysAudioTrack) {
        stopStreams();
        throw new Error("Geen systeemgeluid gedetecteerd! Kies 'Hele Scherm' en vink 'Audio delen' aan.");
      }

      const sysSource = ctx.createMediaStreamSource(screenStream);
      sysSource.connect(merger, 0, 1);
      merger.connect(destination);

      // 4. Setup Recorder
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
        stopStreams();
        setStatus(RecordingState.COMPLETED);
      };

      sysAudioTrack.onended = () => stopRecording();

      recorder.start(1000);
      setStatus(RecordingState.RECORDING);

    } catch (err: any) {
      console.error(err);
      stopStreams();
      setErrorMsg(err.message || "Er is een onbekende fout opgetreden.");
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
    setUploadProgress("Uploaden en verwerken...");
    
    try {
      // Try backend processing first (if Supabase is configured)
      // If VITE_SUPABASE_URL is missing, it will throw, and we can catch/fallback or show error
      if (process.env.VITE_SUPABASE_URL) {
          const text = await processAudioRecording(recordedBlob);
          setTranscription(text);
      } else {
          // Fallback for local testing without backend/supabase
          setUploadProgress("Geen backend geconfigureerd. Gebruik lokale verwerking...");
          const text = await transcribeAudioDirect(recordedBlob);
          setTranscription(text);
      }
      
      setStatus(RecordingState.COMPLETED);
      setUploadProgress("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Fout: " + err.message);
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
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold text-sky-400 mb-4">Hoe neem je op?</h2>
        <ol className="list-decimal list-inside text-slate-300 space-y-3 text-sm">
          <li>
            Klik op <span className="font-semibold text-white">Start Opname</span>. Er verschijnt een browser-popup.
          </li>
          <li className="pl-2 border-l-2 border-sky-500/30 ml-2">
            <strong>Belangrijk:</strong> Kies het tabblad <span className="text-sky-300">Hele scherm</span> (Entire Screen) of <span className="text-sky-300">Tabblad</span>.
            <br/>
            <span className="text-red-400 text-xs uppercase font-bold tracking-wider">Kies geen venster</span> (Window), want dan werkt het geluid niet.
          </li>
          <li>
            Zet het vinkje <strong className="text-emerald-400">Systeemgeluid delen</strong> (linksonder in popup) AAN.
          </li>
          <li>Kies daarna je microfoon als daarom wordt gevraagd.</li>
        </ol>
      </div>

      <div className="bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-700 flex flex-col items-center space-y-6">
        
        <div className="w-full relative">
            <AudioVisualizer stream={mixedStream} isRecording={status === RecordingState.RECORDING} />
            {status === RecordingState.RECORDING && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-red-200 uppercase tracking-wider">REC</span>
                </div>
            )}
        </div>

        <div className="flex gap-4">
          {status === RecordingState.IDLE || status === RecordingState.ERROR || status === RecordingState.COMPLETED ? (
            <button
              onClick={startRecording}
              className="group relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
            >
              <MicIcon />
              <span>{recordedBlob ? "Nieuwe Opname" : "Start Opname"}</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="group flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
            >
              <StopIcon />
              <span>Stop Opname</span>
            </button>
          )}
        </div>

        {errorMsg && (
            <div className="text-red-400 bg-red-900/20 border border-red-900/50 p-4 rounded-lg text-sm text-center max-w-lg">
                {errorMsg}
            </div>
        )}

        {recordedBlob && status !== RecordingState.RECORDING && !transcription && (
             <div className="animate-fade-in flex flex-col items-center gap-4">
                <p className="text-slate-400 text-sm">Opname voltooid ({Math.round(recordedBlob.size / 1024)} KB)</p>
                <button
                    onClick={handleTranscribe}
                    disabled={status === RecordingState.PROCESSING}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    {status === RecordingState.PROCESSING ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{uploadProgress || "Analyseren..."}</span>
                        </>
                    ) : (
                        <span>Transcribeer Audio</span>
                    )}
                </button>
                {status === RecordingState.PROCESSING && (
                  <p className="text-xs text-slate-500 animate-pulse">Dit kan even duren bij lange gesprekken...</p>
                )}
             </div>
        )}
      </div>

      {transcription && (
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700 animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h3 className="text-xl font-bold text-emerald-400">Transcriptie & Samenvatting</h3>
                <button onClick={reset} className="text-slate-400 hover:text-white transition-colors" title="Wis en begin opnieuw">
                    <RefreshIcon />
                </button>
            </div>
            <div className="prose prose-invert prose-slate max-w-none custom-scrollbar overflow-y-auto max-h-[600px] leading-relaxed">
                <ReactMarkdown>{transcription}</ReactMarkdown>
            </div>
        </div>
      )}
    </div>
  );
};

export default Recorder;