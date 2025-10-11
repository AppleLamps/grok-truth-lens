import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pause, Play, Square } from "lucide-react";

interface TTSControlsProps {
  targetRef: React.RefObject<HTMLElement>;
  className?: string;
}

interface UtteranceChunk {
  text: string;
}

const MAX_CHARS = 1600;

function splitTextToChunks(text: string): UtteranceChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  
  // Split on sentence boundaries (avoiding lookbehind for Safari compatibility)
  // Match punctuation followed by whitespace, then split after
  const sentences: string[] = [];
  let current = "";
  for (let i = 0; i < normalized.length; i++) {
    current += normalized[i];
    // Check if we're at a sentence boundary: punctuation followed by space and capital letter
    if ((normalized[i] === '.' || normalized[i] === '!' || normalized[i] === '?') && 
        (i === normalized.length - 1 || (normalized[i + 1] === ' ' && 
         (i + 2 >= normalized.length || /[A-Z0-9]/.test(normalized[i + 2]))))) {
      // Skip any trailing spaces
      while (i + 1 < normalized.length && normalized[i + 1] === ' ') {
        i++;
      }
      sentences.push(current.trim());
      current = "";
    }
  }
  // Add any remaining text
  if (current.trim()) sentences.push(current.trim());
  
  const chunks: UtteranceChunk[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length + 1 > MAX_CHARS) {
      if (buf) chunks.push({ text: buf });
      if (s.length > MAX_CHARS) {
        // hard split long sentence
        for (let i = 0; i < s.length; i += MAX_CHARS) {
          chunks.push({ text: s.slice(i, i + MAX_CHARS) });
        }
        buf = "";
      } else {
        buf = s;
      }
    } else {
      buf = buf ? buf + " " + s : s;
    }
  }
  if (buf) chunks.push({ text: buf });
  return chunks;
}

export default function TTSControls({ targetRef, className }: TTSControlsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIndex, setVoiceIndex] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const queueRef = useRef<UtteranceChunk[]>([]);
  const currentRef = useRef<number>(0);

  // Load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const v = synth.getVoices();
      if (v && v.length) {
        setVoices(v);
        // Prefer English voice if available
        const idx = v.findIndex((vv) => vv.lang?.toLowerCase().startsWith('en'));
        setVoiceIndex(idx >= 0 ? idx : 0);
      }
    };
    load();
    synth.onvoiceschanged = load;
    return () => {
      synth.onvoiceschanged = null as unknown as () => void;
    };
  }, []);

  const getText = useCallback(() => {
    const el = targetRef.current;
    if (!el) return "";
    return el.innerText || "";
  }, [targetRef]);

  const speakNext = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (currentRef.current >= queueRef.current.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }
    const chunk = queueRef.current[currentRef.current];
    const u = new SpeechSynthesisUtterance(chunk.text);
    u.rate = rate;
    if (voices[voiceIndex]) u.voice = voices[voiceIndex];
    u.onend = () => {
      currentRef.current += 1;
      speakNext();
    };
    u.onerror = () => {
      currentRef.current += 1;
      speakNext();
    };
    synth.speak(u);
  }, [rate, voiceIndex, voices]);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }
    synth.cancel();
    const text = getText();
    queueRef.current = splitTextToChunks(text);
    currentRef.current = 0;
    if (queueRef.current.length === 0) return;
    setIsSpeaking(true);
    setIsPaused(false);
    speakNext();
  };

  const handlePause = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const canUse = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="Text to speech controls">
      <div className="flex items-center gap-1">
        <Button type="button" size="sm" variant="outline" onClick={handlePlay} disabled={!canUse} aria-label={isPaused ? "Resume" : "Play"}>
          <Play className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handlePause} disabled={!canUse || !isSpeaking || isPaused} aria-label="Pause">
          <Pause className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleStop} disabled={!canUse} aria-label="Stop">
          <Square className="h-4 w-4" />
        </Button>
      </div>
      <label className="sr-only" htmlFor="voice-select">Voice</label>
      <select
        id="voice-select"
        className="h-8 border rounded px-2 text-sm max-w-[220px]"
        value={voiceIndex}
        onChange={(e) => setVoiceIndex(Number(e.target.value))}
        aria-label="Voice"
      >
        {voices.map((v, i) => (
          <option key={`${v.name}-${i}`} value={i}>{v.name} {v.lang ? `(${v.lang})` : ''}</option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <label htmlFor="rate" className="text-xs text-muted-foreground">Rate</label>
        <input id="rate" type="range" min={0.75} max={1.25} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Rate" />
      </div>
    </div>
  );
}


