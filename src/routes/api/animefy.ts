import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type Body = { image: string; style?: string };

// Enhanced anime style prompts with professional-grade descriptions
const STYLE_PROMPTS: Record<string, string> = {
  ghibli: "Studio Ghibli inspired, soft watercolor backgrounds, rounded character features, warm pastel palette, hand-drawn line art, painterly, nature-focused",
  shonen: "bold shonen anime, sharp line work, dramatic lighting, detailed expressions, action-oriented, thick black outlines, dynamic cel shading, high-energy",
  shoujo: "soft shoujo anime, sparkles and stars, pastel pink palette, dreamy eyes, romantic lighting, soft focus backgrounds, delicate details",
  cyber: "cyberpunk anime, neon city lights, futuristic tech, holographic glow, sharp digital aesthetics, high contrast, glowing effects",
  retro: "1990s cel anime, grainy film texture, nostalgic VHS palette, OVA aesthetic, limited color palette, vintage feel",
  kyoto: "Kyoto Animation style, intricate hair and eye rendering, soft lighting, realistic proportions, detailed backgrounds, polished",
  pencil: "detailed graphite pencil drawing, hand-drawn cross-hatching, paper texture, monochrome, realistic shading, artistic",
  ink: "black ink illustration, bold linework, manga style, no color, white background, high contrast, expressive",
  watercolor: "soft watercolor painting, paper texture, gentle color bleeds, traditional media, wet brush effects, flowing",
  oil: "classical oil painting, visible brush strokes, rich impasto, renaissance lighting, museum quality, textured",
  gray: "high-contrast black and white anime, noir lighting, deep shadows, monochrome, dramatic cinematography, atmospheric",
  pixar: "Pixar-style 3D character render, soft subsurface lighting, expressive eyes, polished 3D animation, modern",
  pop: "Roy Lichtenstein pop art, halftone dots, bold primary colors, comic style, vibrant energy, graphic",
  vangogh: "Van Gogh post-impressionist, swirling brushstrokes, vibrant yellows and blues, expressive texture, artistic",
  lowpoly: "geometric low-poly 3D render, faceted shading, modern minimalist, triangulated surfaces, clean",
  comic: "American comic book art, bold inks, ben-day dots, dynamic shading, action-packed, graphic novel",
  madhouse: "Madhouse animation style, sharp line work, dramatic lighting, detailed character expressions, modern digital",
  trigger: "Trigger animation style, exaggerated expressions, bold color choices, dynamic poses, high-energy, vibrant",
};

export const Route = createFileRoute("/api/animefy")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { image, style } = (await request.json()) as Body;
        if (!image || !image.startsWith("data:image/")) {
          return new Response(JSON.stringify({ error: "Invalid image" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        // Get the style hint from the predefined styles or use default
        const styleHint = style?.trim() && STYLE_PROMPTS[style.trim()] 
          ? STYLE_PROMPTS[style.trim()] 
          : STYLE_PROMPTS.ghibli;

        // Enhanced prompt with multi-layered approach for better results
        const prompt = `Transform this photo into a professional-grade anime illustration with exceptional quality and artistic detail.

STYLE REFERENCE: ${styleHint}

CRITICAL REQUIREMENTS:
1. Identity Preservation: Maintain the subject's facial features, identity, pose, and composition from the original photo
2. Artistic Style: Apply consistent anime art style throughout the entire image matching the style reference
3. Line Art: Use clean, expressive line art with appropriate weight and detail for the chosen style
4. Color Palette: Implement vibrant, well-balanced colors matching the chosen style aesthetic
5. Eyes: Create expressive anime-style eyes with depth, emotion, and characteristic shine
6. Background: Add detailed, atmospheric background that complements the character and style
7. Lighting: Apply cinematic lighting with appropriate shadows, highlights, and mood
8. Quality: Ensure high-resolution output with professional polish, clarity, and detail
9. Anatomy: Maintain anatomical accuracy while applying anime stylization
10. Texture: Add subtle texture and shading to enhance depth and dimension

OUTPUT: A stunning, high-quality anime artwork that captures both the original subject's essence and the chosen artistic style. Professional studio quality.`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: image } },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          return new Response(
            JSON.stringify({ error: `AI gateway error: ${res.status}`, detail: txt }),
            { status: res.status, headers: { "content-type": "application/json" } },
          );
        }

        const data = (await res.json()) as {
          choices?: Array<{
            message?: {
              images?: Array<{ image_url?: { url?: string } }>;
              content?: string;
            };
          }>;
        };

        const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!url) {
          return new Response(
            JSON.stringify({ error: "No image returned", raw: data }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(JSON.stringify({ image: url }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
