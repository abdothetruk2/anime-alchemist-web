import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type Body = { image: string; style?: string };

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

        const styleHint = style?.trim() || "modern anime, Studio Ghibli inspired";
        const prompt = `Transform this photo into a high quality anime illustration. Style: ${styleHint}. Preserve the subject's identity, pose, composition, and key features. Use clean line art, vibrant cel shading, expressive anime eyes, detailed background, cinematic lighting. Output a polished, high-resolution anime artwork.`;

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
