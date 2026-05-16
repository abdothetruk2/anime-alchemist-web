import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  Wand2,
  Download,
  ImageIcon,
  Loader2,
  Sliders,
  Video,
  RotateCcw,
  Mic,
  Copy,
  Check,
  Maximize2,
  Settings,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const STYLES = [
  { id: "ghibli", label: "Ghibli Dream" },
  { id: "shonen", label: "Shonen Hero" },
  { id: "shoujo", label: "Shoujo Glow" },
  { id: "cyber", label: "Cyber Neon" },
  { id: "retro", label: "90s Retro" },
  { id: "kyoto", label: "Kyoto Animation" },
  { id: "pencil", label: "Pencil Sketch" },
  { id: "ink", label: "Ink Drawing" },
  { id: "watercolor", label: "Watercolor" },
  { id: "oil", label: "Oil Painting" },
  { id: "gray", label: "B&W Noir" },
  { id: "pixar", label: "3D Pixar" },
  { id: "pop", label: "Pop Art" },
  { id: "vangogh", label: "Van Gogh" },
  { id: "lowpoly", label: "Low Poly" },
  { id: "comic", label: "Western Comic" },
  { id: "madhouse", label: "Madhouse Studio" },
  { id: "trigger", label: "Trigger Studio" },
];

const MUSIC_PRESETS = [
  { id: "custom", label: "Custom URL" },
  { id: "lofi", label: "Lo-fi Chill", url: "https://cdn.pixabay.com/download/audio/2022/01/20/audio_d0c6ff1bab.mp3" },
  { id: "epic", label: "Epic Battle", url: "https://cdn.pixabay.com/download/audio/2021/04/07/audio_5b826a83ea.mp3" },
  { id: "peaceful", label: "Peaceful", url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3" },
  { id: "upbeat", label: "Upbeat Pop", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
];

type Filters = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sepia: number;
  grayscale: number;
  blur: number;
};

const DEFAULT_FILTERS: Filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
};

function filterCss(f: Filters) {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) hue-rotate(${f.hue}deg) sepia(${f.sepia}%) grayscale(${f.grayscale}%) blur(${f.blur}px)`;
}

async function applyFiltersToDataUrl(src: string, f: Filters): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unsupported"));
      ctx.filter = filterCss(f);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square overflow-hidden rounded-2xl cursor-col-resize bg-muted/40"
      onMouseMove={handleMouseMove}
    >
      <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img
          src={after}
          alt="After"
          className="w-screen h-full object-cover"
          style={{ width: `${100 / (sliderPos / 100)}%` }}
        />
      </div>
      <div className="absolute top-0 bottom-0 w-1 bg-primary shadow-lg" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-full p-2">
          <Maximize2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [original, setOriginal] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleId, setStyleId] = useState("ghibli");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [copied, setCopied] = useState(false);

  const [script, setScript] = useState(
    "Hi, I'm an AI-generated anime character. Welcome to Animefy — where any photo becomes stunning anime art!",
  );
  const [video, setVideo] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("en-US-JennyNeural");

  // Background music state
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicPreset, setMusicPreset] = useState("lofi");
  const [customMusicUrl, setCustomMusicUrl] = useState("");
  const [musicVolume, setMusicVolume] = useState(0.3);
  const musicRef = useRef<HTMLAudioElement>(null);

  const activeMusicUrl =
    musicPreset === "custom"
      ? customMusicUrl
      : (MUSIC_PRESETS.find((p) => p.id === musicPreset)?.url ?? "");

  // Sync background music with video playback
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    if (video && musicEnabled && activeMusicUrl) {
      audio.src = activeMusicUrl;
      audio.volume = musicVolume;
      audio.loop = true;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [video, musicEnabled, activeMusicUrl, musicVolume]);

  // Update volume without reloading track
  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = musicVolume;
  }, [musicVolume]);

  const voices = [
    { id: "en-US-JennyNeural", name: "Jenny (Female)" },
    { id: "en-US-AriaNeural", name: "Aria (Female)" },
    { id: "en-US-AmberNeural", name: "Amber (Female)" },
    { id: "en-US-SaraNeural", name: "Sara (Female)" },
    { id: "en-US-CoraNeural", name: "Cora (Female)" },
    { id: "en-US-MichelleNeural", name: "Michelle (Female)" },
    { id: "en-US-MonicaNeural", name: "Monica (Female)" },
    { id: "en-US-GuyNeural", name: "Guy (Male)" },
    { id: "en-US-BrianNeural", name: "Brian (Male)" },
    { id: "en-US-EricNeural", name: "Eric (Male)" },
    { id: "en-US-ChristopherNeural", name: "Christopher (Male)" },
  ];

  const handleFile = useCallback((f: File) => {
    setError(null);
    setResult(null);
    setVideo(null);
    if (!f.type.startsWith("image/")) return setError("Please upload an image file.");
    if (f.size > 8 * 1024 * 1024) return setError("Image must be under 8 MB.");
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const generate = async () => {
    if (!original) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setVideo(null);
    try {
      const edited = await applyFiltersToDataUrl(original, filters);
      const res = await fetch("/api/animefy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: edited, style: styleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
        throw new Error(data.error || "Generation failed");
      }
      setResult(data.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    const source = result || original;
    if (!source || !script.trim()) return;
    setVideoLoading(true);
    setVideoError(null);
    setVideo(null);
    try {
      const res = await fetch("/api/talking-video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: source, script, voice: selectedVoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video generation failed");
      setVideo(data.video);
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setVideoLoading(false);
    }
  };

  const reset = () => {
    setOriginal(null);
    setResult(null);
    setVideo(null);
    setError(null);
    setFilters(DEFAULT_FILTERS);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const livePreviewStyle = useMemo(() => ({ filter: filterCss(filters) }), [filters]);

  return (
    <div className="min-h-screen bg-soft-gradient overflow-hidden">
      {/* Hidden audio element for background music */}
      <audio ref={musicRef} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 bg-hero-gradient opacity-30 animate-blob blur-3xl" />
        <div
          className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] bg-accent opacity-25 animate-blob blur-3xl"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-80 w-80 bg-primary opacity-20 animate-blob blur-3xl"
          style={{ animationDelay: "6s" }}
        />
      </div>

      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-hero-gradient shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">Animefy Pro</span>
        </div>
        <a
          href="#studio"
          className="hidden rounded-full border-2 border-foreground bg-background px-5 py-2 text-sm font-bold shadow-pop transition-transform hover:-translate-y-0.5 sm:inline-block"
        >
          Start Creating →
        </a>
      </header>

      <section className="container mx-auto px-6 pt-12 pb-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Powered by Google Gemini AI
        </div>
        <h1 className="mt-6 font-display text-5xl leading-[0.95] font-bold sm:text-7xl md:text-8xl">
          Transform photos into{" "}
          <span className="bg-hero-gradient bg-clip-text text-transparent">professional anime art</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          18 stunning art styles, advanced editing tools, and AI-powered talking video generation with background music
          — all in one creative studio.
        </p>
        <a
          href="#studio"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 font-bold text-background shadow-pop transition-transform hover:-translate-y-1"
        >
          <Wand2 className="h-5 w-5" /> Start Creating
        </a>
      </section>

      <section id="studio" className="container mx-auto px-6 pb-24">
        <div className="rounded-[2rem] border-2 border-foreground bg-card p-6 shadow-pop sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload + Edit */}
            <div>
              <h2 className="font-display text-2xl font-bold">1. Upload &amp; Edit</h2>
              <p className="mt-1 text-sm text-muted-foreground">PNG or JPG, up to 8 MB. Adjust live before conversion.</p>

              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !original && inputRef.current?.click()}
                className="mt-4 group relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-foreground/40 bg-muted/40 transition-colors hover:border-primary"
              >
                {original ? (
                  <img src={original} alt="Original" className="h-full w-full object-cover" style={livePreviewStyle} />
                ) : (
                  <div className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="rounded-2xl bg-hero-gradient p-4 shadow-glow">
                      <Upload className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <p className="font-semibold">Drop a photo here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {original && (
                <div className="mt-4 rounded-2xl border-2 border-foreground/10 bg-background/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="flex items-center gap-2 font-bold cursor-pointer hover:text-primary transition-colors"
                    >
                      <Sliders className="h-4 w-4" /> Edit Tools
                    </button>
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  </div>
                  {showAdvancedFilters && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {(
                        [
                          ["brightness", "Brightness", 0, 200, 1],
                          ["contrast", "Contrast", 0, 200, 1],
                          ["saturation", "Saturation", 0, 200, 1],
                          ["hue", "Hue", 0, 360, 1],
                          ["sepia", "Sepia", 0, 100, 1],
                          ["grayscale", "Grayscale", 0, 100, 1],
                          ["blur", "Blur", 0, 10, 0.1],
                        ] as const
                      ).map(([key, label, min, max, step]) => (
                        <label key={key} className="flex flex-col gap-1">
                          <span className="flex justify-between font-semibold">
                            <span>{label}</span>
                            <span className="text-muted-foreground text-xs">{filters[key]}</span>
                          </span>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={filters[key]}
                            onChange={(e) => setFilters({ ...filters, [key]: Number(e.target.value) })}
                            className="accent-primary"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={reset}
                      className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Choose a different photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            <div>
              <h2 className="font-display text-2xl font-bold">2. Anime Version</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your AI-generated artwork appears here.</p>

              <div className="mt-4 relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-hero-gradient">
                {loading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-semibold">Creating anime masterpiece…</p>
                    <p className="text-xs text-muted-foreground">10–20 seconds</p>
                  </div>
                )}
                {result && !loading && (
                  <img src={result} alt="Anime result" className="h-full w-full object-cover" />
                )}
                {!result && !loading && (
                  <div className="flex h-full items-center justify-center text-primary-foreground/80">
                    <ImageIcon className="h-16 w-16 animate-float" />
                  </div>
                )}
              </div>

              {result && original && !loading && (
                <div className="mt-4 p-4 rounded-2xl border-2 border-foreground/10 bg-background/60">
                  <p className="text-xs font-semibold mb-3 text-muted-foreground">Before &amp; After Comparison</p>
                  <BeforeAfterSlider before={original} after={result} />
                </div>
              )}

              {result && !loading && (
                <a
                  href={result}
                  download="anime.png"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background px-4 py-2 text-sm font-bold shadow-pop transition-transform hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              )}
            </div>
          </div>

          {/* Style picker */}
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold">3. Pick a Style</h2>
            <p className="mt-1 text-sm text-muted-foreground mb-4">Choose from 18 professional anime art styles.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all ${
                    styleId === s.id
                      ? "border-foreground bg-foreground text-background shadow-pop"
                      : "border-foreground/20 bg-background hover:border-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              disabled={!original || loading}
              onClick={generate}
              className="inline-flex items-center gap-2 rounded-full bg-hero-gradient px-10 py-4 font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {loading ? "Generating…" : "Create Anime Art"}
            </button>
            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* Talking video */}
          <div className="mt-12 rounded-2xl border-2 border-foreground bg-background p-6 shadow-pop">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl bg-hero-gradient p-2 shadow-glow">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold">4. Talking Video</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Make your anime character talk with realistic lip sync, AI voice, and optional background music.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground block mb-2">
                  <Mic className="mr-1 inline h-3 w-3" /> Script (up to 400 characters)
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={4}
                  maxLength={400}
                  placeholder="What should your character say?"
                  className="w-full rounded-xl border-2 border-foreground/20 bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{script.length}/400</p>

                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground block mt-4 mb-2">
                  <Settings className="mr-1 inline h-3 w-3" /> Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full rounded-xl border-2 border-foreground/20 bg-background p-3 text-sm focus:border-primary focus:outline-none"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>

                {/* Background Music */}
                <div className="mt-4 rounded-xl border-2 border-foreground/10 bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Music className="h-3 w-3" /> Background Music
                    </label>
                    <button
                      onClick={() => setMusicEnabled(!musicEnabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        musicEnabled ? "bg-primary" : "bg-foreground/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          musicEnabled ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {musicEnabled && (
                    <div className="space-y-2 mt-2">
                      <select
                        value={musicPreset}
                        onChange={(e) => setMusicPreset(e.target.value)}
                        className="w-full rounded-lg border-2 border-foreground/20 bg-background p-2 text-xs focus:border-primary focus:outline-none"
                      >
                        {MUSIC_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>

                      {musicPreset === "custom" && (
                        <input
                          type="url"
                          value={customMusicUrl}
                          onChange={(e) => setCustomMusicUrl(e.target.value)}
                          placeholder="Paste a direct MP3/OGG URL…"
                          className="w-full rounded-lg border-2 border-foreground/20 bg-background p-2 text-xs focus:border-primary focus:outline-none"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        {musicVolume === 0 ? (
                          <VolumeX className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(Number(e.target.value))}
                          className="flex-1 accent-primary"
                        />
                        <span className="text-xs text-muted-foreground w-7 text-right">
                          {Math.round(musicVolume * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Music plays alongside the video in your browser.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    disabled={(!result && !original) || videoLoading || !script.trim()}
                    onClick={generateVideo}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background shadow-pop transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {videoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                    {videoLoading ? "Generating…" : "Generate Video"}
                  </button>
                  <button
                    onClick={copyScript}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/20 bg-background px-4 py-3 text-sm font-bold shadow-pop transition-transform hover:-translate-y-0.5"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {videoError && (
                  <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {videoError}
                  </p>
                )}
              </div>

              <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-foreground/20 bg-muted/40">
                {videoLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-semibold">Creating video…</p>
                    <p className="text-xs text-muted-foreground">Up to 60 seconds</p>
                  </div>
                )}
                {video ? (
                  <video src={video} controls autoPlay className="h-full w-full object-cover" />
                ) : (
                  !videoLoading && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                      <Video className="h-10 w-10" />
                      <p className="text-sm">Your talking video will appear here</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {video && (
              <a
                href={video}
                download="anime-talking.mp4"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background px-4 py-2 text-sm font-bold shadow-pop transition-transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" /> Download Video
              </a>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "18 Art Styles", body: "Ghibli, cyberpunk, oil painting, and more professional styles." },
            { icon: Sliders, title: "Advanced Editing", body: "Fine-tune brightness, contrast, hue, and more before generation." },
            { icon: Music, title: "Music + Voice", body: "AI lip-sync voice with optional background music overlay." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border-2 border-foreground bg-background p-6 shadow-pop">
              <div className="inline-flex rounded-xl bg-hero-gradient p-2.5 shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-8 text-center text-sm text-muted-foreground">
        Made with <span className="text-primary">♥</span> · Animefy Pro
      </footer>
    </div>
  );
}
