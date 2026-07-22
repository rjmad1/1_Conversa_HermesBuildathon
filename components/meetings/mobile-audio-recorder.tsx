"use me";
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Pause, Play, Upload, RefreshCw, Volume2, AlertCircle, CheckCircle2 } from "lucide-react";

interface MobileAudioRecorderProps {
  meetingId?: string;
  tenantId?: string;
  workspaceId?: string;
  onUploadSuccess?: (asset: { id: string; fileName: string; durationSeconds: number }) => void;
  onUploadError?: (error: string) => void;
}

export function MobileAudioRecorder({
  meetingId = "demo-meeting",
  tenantId = "tenant-dev",
  workspaceId = "ws-dev",
  onUploadSuccess,
  onUploadError,
}: MobileAudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "stopped" | "uploading" | "success" | "error">("idle");
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<{ id: string; fileName: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Audio Level Meter Setup
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (e) {
        console.warn("Audio meter context setup failed:", e);
      }

      mediaRecorder.start(1000);
      setRecordingState("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied or unavailable";
      setErrorMessage(msg);
      setRecordingState("error");
      if (onUploadError) onUploadError(msg);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === "recording" || recordingState === "paused")) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecordingState("stopped");
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    }
  }, [recordingState]);

  const handleUpload = async () => {
    if (audioChunksRef.current.length === 0) {
      setErrorMessage("No recorded audio found");
      return;
    }

    try {
      setRecordingState("uploading");
      setErrorMessage(null);

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, `smart-device-record-${Date.now()}.webm`);
      formData.append("meetingId", meetingId);
      formData.append("tenantId", tenantId);
      formData.append("workspaceId", workspaceId);

      const res = await fetch("/api/meetings/audio/upload", {
        method: "POST",
        body: formData,
        headers: {
          "x-tenant-id": tenantId,
          "x-workspace-id": workspaceId,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: { message: "Upload failed" } }));
        throw new Error(errJson.error?.message || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      const asset = {
        id: data.assetId || data.id || `audio-${Date.now()}`,
        fileName: data.fileName || `recording-${Date.now()}.webm`,
        durationSeconds: recordingTime,
      };

      setUploadedAsset(asset);
      setRecordingState("success");
      if (onUploadSuccess) onUploadSuccess(asset);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audio upload failed";
      setErrorMessage(msg);
      setRecordingState("error");
      if (onUploadError) onUploadError(msg);
    }
  };

  const resetRecorder = () => {
    stopRecording();
    setRecordingState("idle");
    setRecordingTime(0);
    setAudioLevel(0);
    setErrorMessage(null);
    setUploadedAsset(null);
    audioChunksRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl text-slate-100 font-sans">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-100">Smart Device Audio Capture</h3>
            <p className="text-xs text-slate-400">Mobile & Wearable Mic Ingestion</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-mono">
          {formatTime(recordingTime)}
        </span>
      </div>

      {/* Audio Waveform / Level Meter */}
      <div className="mb-6 bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 h-12 w-full justify-center">
          {[20, 45, 80, 60, 30, 90, 70, 40, 60, 100, 50, 30, 85, 65, 40].map((height, i) => {
            const isActive = recordingState === "recording";
            const levelHeight = isActive ? Math.max(15, Math.min(100, (height * audioLevel) / 60)) : 10;
            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isActive ? "bg-indigo-500 shadow-sm shadow-indigo-500/50" : "bg-slate-700"
                }`}
                style={{ height: `${levelHeight}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
          <span>{recordingState === "recording" ? `Mic Signal: ${audioLevel}%` : "Mic Ready"}</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-lg flex items-start gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Banner */}
      {recordingState === "success" && uploadedAsset && (
        <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Recorded audio uploaded successfully (ID: {uploadedAsset.id})</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3">
        {recordingState === "idle" && (
          <button
            onClick={startRecording}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </button>
        )}

        {recordingState === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-sm font-medium rounded-lg transition-all"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-red-600/30 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
          </>
        )}

        {recordingState === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-red-600/30 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
          </>
        )}

        {recordingState === "stopped" && (
          <>
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload & Process
            </button>
            <button
              onClick={resetRecorder}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}

        {recordingState === "uploading" && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium py-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Uploading & Processing Audio Stream...</span>
          </div>
        )}

        {(recordingState === "success" || recordingState === "error") && (
          <button
            onClick={resetRecorder}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Record Another Meeting
          </button>
        )}
      </div>
    </div>
  );
}
