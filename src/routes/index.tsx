import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Sparkles, Upload, Wand2, Download, ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const STYLES = [
  { id: "ghibli", label: "Ghibli Dream", hint: "Studio Ghibli inspired, soft watercolor backgrounds" },
  { id: "shonen", label: "Shonen Hero", hint: "bold shonen anime, sharp lines, dynamic shading" },
  { id: "shoujo", label: "Shoujo Glow", hint: "soft shoujo anime, sparkles, pastel pink palette" },
  { id: "cyber", label: "Cyber Neon", hint: "cyberpunk anime, neon city lights, futuristic" },
  { id: "retro", label: "90s Retro", hint: "1990s cel anime, grainy film, nostalgic palette" },
];

function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleId, setStyleId] = useState("ghibli");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    setResult(null);
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Image must be under 8 MB.");
      return;
    }
    setFile(f);
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
    try {
      const style = STYLES.find((s) => s.id === styleId)?.hint;
      const res = await fetch("/api/animefy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: original, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
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

  const reset = () => {
    setFile(null);
    setOriginal(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-soft-gradient overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 bg-hero-gradient opacity-30 animate-blob blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] bg-accent opacity-25 animate-blob blur-3xl" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 bg-primary opacity-20 animate-blob blur-3xl" style={{ animationDelay: "6s" }} />
      </div>

      {/* Nav */}
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

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 pb-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Powered by Lovable AI
        </div>
        <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-7xl md:text-8xl">
          Turn any photo into{" "}
          <span className="bg-hero-gradient bg-clip-text text-transparent">anime art</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Upload a portrait, pick a style, and get a stunning, high-resolution anime illustration in seconds.
        </p>
        <a
          href="#studio"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 font-bold text-background shadow-pop transition-transform hover:-translate-y-1"
        >
          <Wand2 className="h-5 w-5" /> Start animefying
        </a>
      </section>

      {/* Studio */}
      <section id="studio" className="container mx-auto px-6 pb-24">
        <div className="rounded-[2rem] border-2 border-foreground bg-card p-6 shadow-pop sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload / Original */}
            <div>
              <h2 className="font-display text-2xl">1. Upload your photo</h2>
              <p className="mt-1 text-sm text-muted-foreground">PNG or JPG, up to 8 MB. Faces work best.</p>

              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="mt-4 group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-foreground/40 bg-muted/40 transition-colors hover:border-primary hover:bg-primary/5"
              >
                {original ? (
                  <img src={original} alt="Original" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
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

              {file && (
                <button
                  onClick={reset}
                  className="mt-3 text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
                >
                  Choose a different photo
                </button>
              )}
            </div>

            {/* Result */}
            <div>
              <h2 className="font-display text-2xl">2. Anime version</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your AI-generated artwork appears here.</p>

              <div className="mt-4 relative aspect-square overflow-hidden rounded-2xl border-2 border-foreground bg-hero-gradient">
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-semibold">Painting your anime…</p>
                    <p className="text-xs text-muted-foreground">This usually takes 10–20 seconds</p>
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

          {/* Action */}
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
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "Studio quality", body: "Cel shading, sharp linework, cinematic lighting." },
            { icon: Wand2, title: "5 anime styles", body: "Ghibli, shonen, shoujo, cyber, and retro 90s." },
            { icon: Download, title: "Instant download", body: "Save your high-resolution anime in one click." },
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
