import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type Body = { image: string; script: string; voice?: string };

// Uses D-ID Talks API — requires DID_API_KEY secret.
// Docs: https://docs.d-id.com/reference/talks-overview
export const Route = createFileRoute("/api/talking-video")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { image, script, voice } = (await request.json()) as Body;
        if (!image || !script) {
          return new Response(JSON.stringify({ error: "Missing image or script" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

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

        // D-ID needs an image URL. If a data URL was sent, upload first.
        let sourceUrl = image;
        if (image.startsWith("data:image/")) {
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
        }

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
                voice_id: voice || "en-US-JennyNeural",
              },
            },
            config: { stitch: true },
          }),
        });
        if (!create.ok) {
          return new Response(
            JSON.stringify({ error: `D-ID create failed: ${await create.text()}` }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
        const { id } = (await create.json()) as { id: string };

        // Poll up to ~60s for the result.
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const poll = await fetch(`https://api.d-id.com/talks/${id}`, {
            headers: { Authorization: `Basic ${key}` },
          });
          const data = (await poll.json()) as { status: string; result_url?: string };
          if (data.status === "done" && data.result_url) {
            return new Response(JSON.stringify({ video: data.result_url }), {
              headers: { "content-type": "application/json" },
            });
          }
          if (data.status === "error") {
            return new Response(JSON.stringify({ error: "D-ID generation failed" }), {
              status: 502,
              headers: { "content-type": "application/json" },
            });
          }
        }
        return new Response(JSON.stringify({ error: "Timed out waiting for video" }), {
          status: 504,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
