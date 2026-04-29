import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MODEL = "gemini-2.5-flash";
const REFERENCE_DESCRIPTION_PROMPT = [
  "Look at the uploaded images and describe their shared visual style as concise bullet points.",
  "Write 4 to 6 bullets, each starting with '- '.",
  "Focus on visual qualities that help create new images in a similar style: color palette, lighting, composition, textures, mood, subject treatment, and graphic details.",
  "Do not mention or infer any brand names, logos, trademarks, product names, or other identifying text seen in the images.",
  "Ignore all visible words and labels; describe only non-branded visual characteristics.",
  "Do not include headings, numbered lists, bold text, italics, introductions, or conclusions.",
].join(" ");

async function loadGoogleGenAI() {
  try {
    return (await import("@google/genai")).GoogleGenAI;
  } catch (error) {
    const localInstallUrl = pathToFileURL(join(process.cwd(), "node_modules/@google/genai/dist/node/index.mjs")).href;
    return (await import(localInstallUrl)).GoogleGenAI;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dataUrlToPart(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

function mockDescription() {
  return [
    "- Bright, friendly color relationships with soft contrast and a polished commercial feel.",
    "- Clean shapes, approachable textures, and warm visual details that can translate across many campaign image types.",
    "- A cohesive style direction that favors inviting, brand-ready imagery over technical or overly literal visuals.",
  ].join("\n");
}

function normalizeBulletText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^here (are|is)\b/i.test(line))
    .filter((line) => !/^visual characteristics\b/i.test(line))
    .map((line) => {
      const bulletMatch = /^\s*([-*•])\s+(.+)$/.exec(line);
      const marker = bulletMatch?.[1] === "*" ? "*" : "-";
      const text = (bulletMatch?.[2] ?? line.replace(/^\s*\d+[.)]\s*/, ""))
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/[*_`]/g, "")
        .trim();

      return text ? `${marker} ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to describe reference images." });
  }

  const body = request.body ?? {};
  const imageParts = (Array.isArray(body.inspirationImages) ? body.inspirationImages.slice(0, 5) : [])
    .filter(Boolean)
    .map(dataUrlToPart)
    .filter(Boolean);

  if (imageParts.length === 0) {
    return response.status(400).json({ error: "Upload reference images first." });
  }

  if (!process.env.GEMINI_API_KEY) {
    await sleep(500);
    return response.status(200).json({ description: mockDescription() });
  }

  try {
    const GoogleGenAI = await loadGoogleGenAI();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_TEXT_MODEL || DEFAULT_MODEL;
    const result = await ai.models.generateContent({
      model,
      contents: [{ text: REFERENCE_DESCRIPTION_PROMPT }, ...imageParts],
    });
    const description = normalizeBulletText(result.text ?? "");

    if (!description) {
      return response.status(502).json({ error: "No reference description came back. Try uploading again." });
    }

    return response.status(200).json({ description });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "The reference images could not be described. Try again." });
  }
}
