import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type Body = { image: string; script: string; voice?: string };

// D-ID supports various Microsoft Azure voices for natural speech synthesis
const SUPPORTED_VOICES: Record<string, string> = {
  "en-US-JennyNeural": "Jenny (Female - Friendly)",
  "en-US-AriaNeural": "Aria (Female - Professional)",
  "en-US-GuyNeural": "Guy (Male - Deep)",
  "en-US-AmberNeural": "Amber (Female - Warm)",
  "en-US-AshleyNeural": "Ashley (Female - Bright)",
  "en-US-CoraNeural": "Cora (Female - Calm)",
  "en-US-ElizabethNeural": "Elizabeth (Female - Gentle)",
  "en-US-MichelleNeural": "Michelle (Female - Energetic)",
  "en-US-MonicaNeural": "Monica (Female - Cheerful)",
  "en-US-SaraNeural": "Sara (Female - Expressive)",
  "en-US-BrianNeural": "Brian (Male - Warm)",
  "en-US-ChristopherNeural": "Christopher (Male - Professional)",
  "en-US-EricNeural": "Eric (Male - Friendly)",
  "en-US-JacobNeural": "Jacob (Male - Energetic)",
  "en-US-RyanNeural": "Ryan (Male - Casual)",
};

/**
 * Talking Video API Route
 * 
 * Uses D-ID Talks API to generate realistic talking videos from anime portraits.
 * Docs: https://docs.d-id.com/reference/talks-overview
 * 
 * Features:
 * - Multiple voice options for character personality
 * - Automatic lip-sync with realistic mouth movements
 * - Support for both data URLs and direct image URLs
 * - Configurable video quality and stitching
 */
export const Route = createFileRoute("/api/talking-video")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { image, script, voice } = (await request.json()) as Body;
        
        // Validate inputs
        if (!image || !script) {
          return new Response(JSON.stringify({ error: "Missing image or script" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Check for D-ID API key
        const key = process.env.DID_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({
              error:
                "Talking video needs a D-ID API key. Add DID_API_KEY in project secrets (sign up free at d-id.com).",
            }),
            { status: 501, headers: { "content-type": "application/json" } },
          );
        }

        // Validate and select voice
        const selectedVoice = voice && SUPPORTED_VOICES[voice] ? voice : "en-US-JennyNeural";

        // D-ID needs an image URL. If a data URL was sent, upload first.
        let sourceUrl = image;
        if (image.startsWith("data:image/")) {
          try {
            const blob = await (await fetch(image)).blob();
            const fd = new FormData();
            fd.append("image", blob, "source.png");
            
            const up = await fetch("https://api.d-id.com/images", {
              method: "POST",
              headers: { Authorization: `Basic ${key}` },
              body: fd,
            });
            
            if (!up.ok) {
              return new Response(
                JSON.stringify({ error: `D-ID upload failed: ${await up.text()}` }),
                { status: 502, headers: { "content-type": "application/json" } },
              );
            }
            sourceUrl = ((await up.json()) as { url: string }).url;
          } catch (err) {
            return new Response(
              JSON.stringify({ error: "Failed to upload image to D-ID" }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }
        }

        // Create talking video with D-ID API
        try {
          const create = await fetch("https://api.d-id.com/talks", {
            method: "POST",
            headers: {
              Authorization: `Basic ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source_url: sourceUrl,
              script: {
                type: "text",
                input: script,
                provider: {
                  type: "microsoft",
                  voice_id: selectedVoice,
                },
              },
              config: {
                stitch: true, // Smooth stitching between frames
                fluent: true, // Fluent animation
              },
            }),
          });

          if (!create.ok) {
            return new Response(
              JSON.stringify({ error: `D-ID create failed: ${await create.text()}` }),
              { status: 502, headers: { "content-type": "application/json" } },
            );
          }

          const { id } = (await create.json()) as { id: string };

          // Poll for video completion (up to ~60 seconds)
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            
            const poll = await fetch(`https://api.d-id.com/talks/${id}`, {
              headers: { Authorization: `Basic ${key}` },
            });
            
            const data = (await poll.json()) as { 
              status: string; 
              result_url?: string;
              error?: string;
            };

            if (data.status === "done" && data.result_url) {
              return new Response(JSON.stringify({ video: data.result_url }), {
                headers: { "content-type": "application/json" },
              });
            }

            if (data.status === "error") {
              return new Response(
                JSON.stringify({ error: `D-ID generation failed: ${data.error || "Unknown error"}` }),
                { status: 502, headers: { "content-type": "application/json" } },
              );
            }
          }

          return new Response(JSON.stringify({ error: "Timed out waiting for video" }), {
            status: 504,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: "Failed to generate talking video" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
