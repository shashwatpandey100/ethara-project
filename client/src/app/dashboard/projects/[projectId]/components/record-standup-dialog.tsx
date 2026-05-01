"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mic, Square } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createStandup } from "@/lib/api/standups";
import { toast } from "sonner";

/* ─── Waveform canvas ─── */
function WaveformVisualizer({
  isRecording,
  analyser,
}: {
  isRecording: boolean;
  analyser: AnalyserNode | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isRecording || !analyser) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      historyRef.current = [];
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgb(249,250,251)";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      return;
    }

    const BAR_W = 3, BAR_GAP = 3, TOTAL = BAR_W + BAR_GAP;
    const UPDATE_MS = 40, NOISE = 0.01, MULTIPLIER = 20;
    const dpr = window.devicePixelRatio || 1;
    const displayH = 80;
    const displayW = canvas.clientWidth || 500;

    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = "100%";
    canvas.style.height = `${displayH}px`;
    ctx.scale(dpr, dpr);

    const buf = new Uint8Array(analyser.frequencyBinCount);

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);

      if (ts - lastUpdateRef.current >= UPDATE_MS) {
        lastUpdateRef.current = ts;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
        const rms = Math.sqrt(sum / buf.length);
        const amp = rms > NOISE ? Math.min((rms - NOISE) * MULTIPLIER, 1) : 0;
        historyRef.current.push(amp);
        const maxBars = Math.floor((canvas.clientWidth || displayW) / TOTAL);
        if (historyRef.current.length > maxBars) historyRef.current.shift();
      }

      ctx.fillStyle = "rgb(249,250,251)";
      ctx.fillRect(0, 0, displayW, displayH);
      ctx.lineCap = "round";
      ctx.lineWidth = BAR_W;
      ctx.strokeStyle = "rgb(17,24,39)";
      const cy = displayH / 2, maxH = displayH - 8;
      historyRef.current.forEach((v, i) => {
        const x = i * TOTAL + BAR_W / 2;
        const h = Math.max(v * maxH, 4);
        ctx.beginPath();
        ctx.moveTo(x, cy - h / 2);
        ctx.lineTo(x, cy + h / 2);
        ctx.stroke();
      });
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isRecording, analyser]);

  return (
    <div className="w-full overflow-hidden rounded-xl bg-gray-50 p-3">
      <canvas ref={canvasRef} className="h-[80px] w-full" />
    </div>
  );
}

/* ─── Dialog ─── */
interface RecordStandupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

const fmt = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export function RecordStandupDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: RecordStandupDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durRef = useRef(0);

  const cleanup = () => {
    if (mrRef.current?.state !== "inactive") mrRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAnalyser(null);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setTitle("");
    setDuration(0);
    durRef.current = 0;
    setUploadProgress(0);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { cleanup(); reset(); }
    onOpenChange(v);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      ctxRef.current = audioCtx;

      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      audioCtx.createMediaStreamSource(stream).connect(analyserNode);
      setAnalyser(analyserNode);

      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];
      durRef.current = 0;

      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const recorded = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(recorded);
        setBlob(recorded);
        setPreviewUrl(url);
        chunksRef.current = [];
      };

      mr.start(100);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration((p) => { const n = p + 1; durRef.current = n; return n; });
      }, 1000);
    } catch {
      toast.error("Could not access microphone. Check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mrRef.current?.state !== "inactive") mrRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    setAnalyser(null);
  };

  const handleSubmit = async () => {
    if (!blob) return;
    setUploading(true);
    setUploadProgress(0);
    let cloudUrl: string;
    try {
      const res = await uploadToCloudinary(
        blob,
        `standup-${projectId}-${Date.now()}.webm`,
        setUploadProgress,
      );
      cloudUrl = res.secure_url;
    } catch {
      toast.error("Upload failed.");
      setUploading(false);
      return;
    }
    setUploading(false);
    setSubmitting(true);
    try {
      await createStandup(projectId, {
        title: title.trim() || undefined,
        audioUrl: cloudUrl,
      });
      toast.success("Standup submitted! AI is processing…");
      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to submit standup");
    } finally {
      setSubmitting(false);
    }
  };

  const step: "idle" | "recording" | "preview" =
    isRecording ? "recording" : blob ? "preview" : "idle";

  const busy = uploading || submitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-[600px] p-0">
        <DialogHeader className="flex flex-col gap-0 border-b p-6">
          <DialogTitle className="text-[24px] font-[500] text-[#141414]">
            New Voice Standup
          </DialogTitle>
          <p className="mt-0.5 text-[14px] text-gray-600">
            Record your standup — AI will transcribe it and extract action items.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pt-5 pb-4">
          {/* Waveform — only visible while recording */}
          {isRecording && <WaveformVisualizer isRecording={isRecording} analyser={analyser} />}

          {/* Big record button */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
                isRecording
                  ? "border-red-400 bg-red-50 hover:bg-red-100"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {isRecording && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-300 opacity-30" />
              )}
              {isRecording ? (
                <Square size={24} fill="rgb(239,68,68)" className="text-red-500" />
              ) : (
                <Mic size={24} className="text-gray-500" />
              )}
            </button>
            <span className={`font-mono text-sm ${isRecording ? "text-red-500" : "text-gray-400"}`}>
              {fmt(duration)}
            </span>
            <p className="text-xs text-gray-400">
              {step === "idle" && "Click to start recording"}
              {step === "recording" && "Recording — click to stop"}
              {step === "preview" && "Recording complete"}
            </p>
          </div>

          {/* Preview + form */}
          {step === "preview" && (
            <>
              <audio controls src={previewUrl ?? ""} className="h-10 w-full" />
              <div className="flex flex-col gap-2">
                <Label htmlFor="standup-title">
                  Title{" "}
                  <span className="text-[13px] font-normal text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="standup-title"
                  placeholder="e.g. Sprint 12 Day 3 Standup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t p-6">
          <div className="flex w-full justify-start gap-2">
            <Button
              size="lg"
              disabled={step !== "preview" || busy}
              onClick={handleSubmit}
            >
              {uploading ? (
                <><Loader2 size={15} className="animate-spin" /> Uploading {uploadProgress}%</>
              ) : submitting ? (
                <><Loader2 size={15} className="animate-spin" /> Submitting…</>
              ) : (
                "Submit Standup"
              )}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              disabled={busy}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
