export type Concept = {
  id: string;
  imageUrl: string;
  promptSummary: string;
};

export type GeneratePayload = {
  logo: string | null;
  inspirationImages: string[];
  campaignPrompt: string;
};

export async function generateConcepts(payload: GeneratePayload): Promise<Concept[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "The visuals could not be generated.");
  }

  return data.concepts;
}
