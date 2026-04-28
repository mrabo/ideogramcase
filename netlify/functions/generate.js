import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

async function loadGoogleGenAI() {
  try {
    return (await import("@google/genai")).GoogleGenAI;
  } catch (error) {
    const localInstallUrl = pathToFileURL(join(process.cwd(), "node_modules/@google/genai/dist/node/index.mjs")).href;
    return (await import(localInstallUrl)).GoogleGenAI;
  }
}

const conceptOne =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1125'%3E%3Cdefs%3E%3CradialGradient id='g' cx='45%25' cy='37%25' r='70%25'%3E%3Cstop stop-color='%232b5b67'/%3E%3Cstop offset='.55' stop-color='%230d1d24'/%3E%3Cstop offset='1' stop-color='%23050a10'/%3E%3C/radialGradient%3E%3ClinearGradient id='p' x1='0' x2='1'%3E%3Cstop stop-color='%23e9a6b6'/%3E%3Cstop offset='1' stop-color='%23f7c762'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='1125' rx='62' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%237fd9ec' opacity='.5' stroke-width='3'%3E%3Cpath d='M255 355c78-57 151-52 221 15s135 76 194 27' stroke-dasharray='11 17'/%3E%3Ccircle cx='255' cy='355' r='15'/%3E%3Ccircle cx='475' cy='370' r='17'/%3E%3Ccircle cx='670' cy='397' r='15'/%3E%3C/g%3E%3Crect x='255' y='575' width='390' height='210' rx='28' fill='%23102027' stroke='%238cc8d2' stroke-width='4'/%3E%3Crect x='312' y='520' width='265' height='160' rx='16' fill='%23234657' stroke='%2397dcea' stroke-width='5'/%3E%3Crect x='340' y='548' width='210' height='100' rx='10' fill='%230e2635'/%3E%3Cpath d='M302 786h296l50 86H244z' fill='%23080c11'/%3E%3Cellipse cx='450' cy='904' rx='260' ry='28' fill='%23010205' opacity='.7'/%3E%3Cpath d='M330 880c80 24 175 23 263-1' stroke='url(%23p)' stroke-width='7' stroke-linecap='round' opacity='.55'/%3E%3Ctext x='450' y='995' text-anchor='middle' fill='%239bc8d2' font-family='Arial' font-size='42' font-weight='700' letter-spacing='8'%3ECONCEPT 1%3C/text%3E%3C/svg%3E";

const conceptTwo =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1125'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='42%25' r='65%25'%3E%3Cstop stop-color='%23284d5c'/%3E%3Cstop offset='.54' stop-color='%2309141c'/%3E%3Cstop offset='1' stop-color='%2303080d'/%3E%3C/radialGradient%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur stdDeviation='8'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='900' height='1125' rx='62' fill='url(%23g)'/%3E%3Cpath d='M428 275c126 11 213 101 207 221-5 104-77 156-176 203-58 28-90 57-95 108h293' fill='none' stroke='%237ee8ff' stroke-width='72' stroke-linecap='round' stroke-linejoin='round' filter='url(%23blur)' opacity='.28'/%3E%3Cpath d='M428 275c126 11 213 101 207 221-5 104-77 156-176 203-58 28-90 57-95 108h293' fill='none' stroke='%237ee8ff' stroke-width='34' stroke-linecap='round' stroke-linejoin='round' opacity='.9'/%3E%3Cpath d='M255 896h390' stroke='%237ee8ff' stroke-width='8' stroke-linecap='round' opacity='.32'/%3E%3Cellipse cx='450' cy='940' rx='290' ry='35' fill='%237ee8ff' opacity='.08'/%3E%3Cg fill='%237ee8ff' opacity='.72'%3E%3Ccircle cx='279' cy='370' r='4'/%3E%3Ccircle cx='318' cy='288' r='5'/%3E%3Ccircle cx='612' cy='292' r='4'/%3E%3Ccircle cx='681' cy='435' r='4'/%3E%3Ccircle cx='529' cy='774' r='5'/%3E%3C/g%3E%3Ctext x='450' y='996' text-anchor='middle' fill='%239bc8d2' font-family='Arial' font-size='43' font-weight='700' letter-spacing='8'%3ECONCEPT 2%3C/text%3E%3C/svg%3E";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function mockConcepts(prompt) {
  const summary = prompt.trim().slice(0, 92) || "Campaign image concept";

  return [
    { id: `mock-${Date.now()}-1`, imageUrl: conceptOne, promptSummary: summary },
    { id: `mock-${Date.now()}-2`, imageUrl: conceptTwo, promptSummary: summary },
  ];
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

function buildPrompt(campaignPrompt, conceptNumber) {
  return [
    `Create professional campaign image concept ${conceptNumber} of 2.`,
    "Use the provided logo as brand identity context and the inspiration images for mood, palette, materials, lighting, and styling.",
    "Do not explain the result. Return image outputs.",
    `Campaign image request: ${campaignPrompt}`,
  ].join("\n");
}

async function generateConceptImage(ai, model, imageParts, campaignPrompt, conceptNumber) {
  const result = await ai.models.generateContent({
    model,
    contents: [{ text: buildPrompt(campaignPrompt, conceptNumber) }, ...imageParts],
  });
  const part = result.candidates?.[0]?.content?.parts?.find((candidatePart) => candidatePart.inlineData?.data);

  if (!part?.inlineData?.data) {
    return null;
  }

  return {
    id: `gemini-${Date.now()}-${conceptNumber}`,
    imageUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`,
    promptSummary: campaignPrompt.slice(0, 92),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Use POST to generate visuals." });
  }

  const body = JSON.parse(event.body || "{}");
  const campaignPrompt = String(body.campaignPrompt ?? "").trim();

  if (!campaignPrompt) {
    return json(400, { error: "Describe the campaign image first." });
  }

  if (!process.env.GEMINI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return json(200, { concepts: mockConcepts(campaignPrompt) });
  }

  try {
    const GoogleGenAI = await loadGoogleGenAI();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
    const imageParts = [body.logo, ...(Array.isArray(body.inspirationImages) ? body.inspirationImages.slice(0, 5) : [])]
      .filter(Boolean)
      .map(dataUrlToPart)
      .filter(Boolean);

    const concepts = (
      await Promise.all([1, 2].map((conceptNumber) => generateConceptImage(ai, model, imageParts, campaignPrompt, conceptNumber)))
    ).filter(Boolean);

    if (concepts.length < 2) {
      return json(502, { error: "No image concepts came back. Try regenerating." });
    }

    return json(200, { concepts });
  } catch (error) {
    console.error(error);
    return json(500, { error: "The visuals could not be generated. Try again." });
  }
}
