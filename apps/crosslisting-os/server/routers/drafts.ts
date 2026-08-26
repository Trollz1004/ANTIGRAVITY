import { invokeLLM } from "./_core/llm";

export type DraftKind = "title" | "description" | "category_attributes";

export type ListingDraft = {
  title: string;
  description: string;
  categoryHint: string;
  attributes: Array<{ name: string; value: string }>;
  warnings: string[];
  needsReview: boolean;
};

const draftSchema = {
  name: "listing_draft",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      categoryHint: { type: "string" },
      attributes: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, value: { type: "string" } },
          required: ["name", "value"],
          additionalProperties: false,
        },
      },
      warnings: { type: "array", items: { type: "string" } },
      needsReview: { type: "boolean" },
    },
    required: ["title", "description", "categoryHint", "attributes", "warnings", "needsReview"],
    additionalProperties: false,
  },
} as const;

function parseDraft(content: string | unknown): ListingDraft {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const parsed = JSON.parse(text) as ListingDraft;
  return { ...parsed, needsReview: true };
}

export async function createReviewOnlyDraft(input: { kind: DraftKind; factualRecord: string }) {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: "You are a controlled marketplace listing drafter. Use only the supplied factual record. Never invent product identity, condition, edition, compatibility, category, included items, claims, pricing, or any unavailable attribute. If facts are incomplete, leave the relevant output empty and add a precise warning. Keep the result concise. All output is a review-only draft and must set needsReview to true.",
      },
      {
        role: "user",
        content: `Requested draft type: ${input.kind}\n\nVerified factual record:\n${input.factualRecord}`,
      },
    ],
    outputSchema: draftSchema,
  });
  return parseDraft(response.choices[0]?.message.content ?? "{}");
}
