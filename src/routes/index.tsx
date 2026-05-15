import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const STYLES = [
  { id: "ghibli", label: "Ghibli Dream", hint: "Studio Ghibli inspired, soft watercolor backgrounds, painterly" },
  { id: "shonen", label: "Shonen Hero", hint: "bold shonen anime, sharp lines, dynamic shading, action lighting" },
  { id: "shoujo", label: "Shoujo Glow", hint: "soft shoujo anime, sparkles, pastel pink palette, dreamy eyes" },
  { id: "cyber", label: "Cyber Neon", hint: "cyberpunk anime, neon city lights, futuristic, holographic glow" },
  { id: "retro", label: "90s Retro", hint: "1990s cel anime, grainy film, nostalgic VHS palette" },
  { id: "pencil", label: "Pencil Sketch", hint: "detailed graphite pencil drawing, hand-drawn cross-hatching, paper texture, monochrome" },
  { id: "ink", label: "Ink Drawing", hint: "black ink illustration, bold linework, manga style, no color, white background" },
  { id: "watercolor", label: "Watercolor", hint: "soft watercolor painting, paper texture, gentle color bleeds, traditional media" },
  { id: "oil", label: "Oil Painting", hint: "classical oil painting, visible brush strokes, rich impasto, renaissance lighting" },
  { id: "gray", label: "B&W Noir", hint: "high-contrast black and white anime, noir lighting, deep shadows, monochrome" },
  { id: "pixar", label: "3D Pixar", hint: "Pixar-style 3D character render, soft subsurface lighting, expressive eyes" },
  { id: "pop", label: "Pop Art", hint: "Roy Lichtenstein pop art, halftone dots, bold primary colors, comic style" },
  { id: "vangogh", label: "Van Gogh", hint: "Van Gogh post-impressionist, swirling brushstrokes, vibrant yellows and blues" },
  { id: "lowpoly", label: "Low Poly", hint: "geometric low-poly 3D render, faceted shading, modern minimalist" },
  { id: "comic", label: "Western Comic", hint: "American comic book art, bold inks, ben-day dots, dynamic shading" },
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

function Index() {
  const [original, setOriginal] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleId, setStyleId] = useState("ghibli");
  const inputRef = useRef<HTMLInputElement>(null);

  const [script, setScript] = useState(
    "Hi, I'm an AI-generated character. Welcome to Animefy — where any photo becomes anime art!",
  );
  const [video, setVideo] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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
      // Bake the edit filters into the image before sending.
      const edited = await applyFiltersToDataUrl(original, filters);
      const style = STYLES.find((s) => s.id === styleId)?.hint;
      const res = await fetch("/api/animefy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: edited, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
        if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
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
        body: JSON.stringify({ image: source, script }),
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

  const livePreviewStyle = useMemo(() => ({ filter: filterCss(filters) }), [filters]);

  return (
    <div className="min-h-screen bg-soft-gradient overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 bg-hero-gradient opacity-30 animate-blob blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] bg-accent opacity-25 animate-blob blur-3xl" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 bg-primary opacity-20 animate-blob blur-3xl" style={{ animationDelay: "6s" }} />
      </div>

      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-hero-gradient shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl">Animefy</span>
        </div>
        <a
          href="#studio"
          className="hidden rounded-full border-2 border-foreground bg-background px-5 py-2 text-sm font-bold shadow-pop transition-transform hover:-translate-y-0.5 sm:inline-block"
        >
          Try it free →
        </a>
      </header>

      <section className="container mx-auto px-6 pt-12 pb-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Powered by Lovable AI
        </div>
        <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-7xl md:text-8xl">
          Turn any photo into{" "}
          <span className="bg-hero-gradient bg-clip-text text-transparent">anime art</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          15 art styles, pro edit tools, and a talking-intro video generator — all from one photo.
        </p>
        <a
          href="#studio"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 font-bold text-background shadow-pop transition-transform hover:-translate-y-1"
        >
          <Wand2 className="h-5 w-5" /> Start animefying
        </a>
      </section>

      <section id="studio" className="container mx-auto px-6 pb-24">
        <div className="rounded-[2rem] border-2 border-foreground bg-card p-6 shadow-pop sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload + Edit */}
            <div>
              <h2 className="font-display text-2xl">1. Upload &amp; edit</h2>
              <p className="mt-1 text-sm text-muted-foreground">PNG or JPG, up to 8 MB. Adjust live, then animefy.</p>

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
                    <div className="flex items-center gap-2 font-bold">
                      <Sliders className="h-4 w-4" /> Edit tools
                    </div>
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  </div>
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
                          <span className="text-muted-foreground">{filters[key]}</span>
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={reset} className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline">
                      Choose a different photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            <div>
              <h2 className="font-display text-2xl">2. Anime version</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your AI-generated artwork appears here.</p>

              <div className="mt-4 relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-hero-gradient">
                {loading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-semibold">Painting your anime…</p>
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
            <h2 className="font-display text-2xl">3. Pick a style</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${
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
              {loading ? "Generating…" : "Animefy this photo"}
            </button>
            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* Talking video */}
          <div className="mt-12 rounded-2xl border-2 border-foreground bg-background p-6 shadow-pop">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-hero-gradient p-2 shadow-glow">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl">4. Talking intro video</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Make your anime portrait talk and introduce itself with realistic lip sync.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <Mic className="mr-1 inline h-3 w-3" /> What should it say?
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={5}
                  maxLength={400}
                  placeholder="Hi, I'm…"
                  className="mt-2 w-full rounded-xl border-2 border-foreground/20 bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{script.length}/400</p>
                <button
                  disabled={(!result && !original) || videoLoading || !script.trim()}
                  onClick={generateVideo}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background shadow-pop transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {videoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {videoLoading ? "Generating video…" : "Generate talking video"}
                </button>
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
                    <p className="text-sm font-semibold">Animating lips…</p>
                    <p className="text-xs text-muted-foreground">Up to 60s</p>
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
                download="intro.mp4"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-background px-4 py-2 text-sm font-bold shadow-pop transition-transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" /> Download video
              </a>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "15 art styles", body: "Anime, sketch, watercolor, oil, B&W, 3D and more." },
            { icon: Sliders, title: "Pro edit tools", body: "Brightness, contrast, hue, blur — bake before you generate." },
            { icon: Video, title: "Talking videos", body: "Turn your portrait into an introducing video with lip sync." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border-2 border-foreground bg-background p-6 shadow-pop">
              <div className="inline-flex rounded-xl bg-hero-gradient p-2.5 shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-8 text-center text-sm text-muted-foreground">
        Made with <span className="text-primary">♥</span> · Animefy
      </footer>
    </div>
  );
}
