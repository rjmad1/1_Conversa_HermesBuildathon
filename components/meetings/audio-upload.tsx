"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AudioUploadProps {
  meetingId: string;
}

export function AudioUpload({ meetingId }: AudioUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an audio file first");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`/api/v1/meetings/${meetingId}/audio`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload audio file");
      }

      toast.success("Audio uploaded successfully");
      router.push(`/meetings/${meetingId}/processing`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatedCard variant="flat" index={0} className="p-6 space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
          dragActive
            ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 scale-[1.01]"
            : "border-[var(--border)] hover:border-brand-400 bg-[var(--background)]/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.webm"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-500">
            {selectedFile ? <FileAudio className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
          </div>

          {selectedFile ? (
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{selectedFile.name}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "Audio"}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Drag & drop audio recording, or <span className="text-brand-500 underline">browse</span>
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Supports MP3, WAV, M4A, WEBM (up to 100MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white",
              "bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
            )}
          >
            {isUploading ? "Uploading & Processing..." : "Process Audio Recording"}
          </button>
        </div>
      )}
    </AnimatedCard>
  );
}
