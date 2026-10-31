import Anthropic from "@anthropic-ai/sdk";
import type {
  AcquisitionReasoningModel,
  AcquisitionReasoningModelRequest,
} from "./reasoning-contract";

export class AnthropicAcquisitionReasoningModel
  implements AcquisitionReasoningModel
{
  constructor(private readonly client: Pick<Anthropic, "messages">) {}

  async generateStructured(request: AcquisitionReasoningModelRequest) {
    // Claude 4.7+ / 5.x reject non-default temperature and forced tool choice.
    // Only legacy models get those settings; newer ones are steered by prompt,
    // and the engine validates the returned draft either way.
    const legacy = /^claude-[a-z]+-(3|4-[0-6])(-|$)/.test(request.model);
    const instruction =
      `\n\nSubmit your answer only by calling the ${request.toolName} tool, exactly once. Do not reply in plain text.`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        ...(legacy ? { temperature: request.temperature } : {}),
        system: legacy ? request.systemPrompt : request.systemPrompt + instruction,
        messages: [{ role: "user", content: request.userPrompt }],
        tools: [
          {
            name: request.toolName,
            description:
              "Submit the evidence-controlled Acquisition Lens narrative reasoning draft.",
            input_schema:
              request.toolSchema as Anthropic.Messages.Tool.InputSchema,
          },
        ],
        tool_choice: legacy
          ? { type: "tool", name: request.toolName }
          : { type: "auto" },
      });

      const toolUse = response.content.find(
        (block) =>
          block.type === "tool_use" && block.name === request.toolName,
      );
      if (toolUse && toolUse.type === "tool_use") {
        return toolUse.input;
      }
      if (legacy) break;
    }
    throw new Error(
      `Anthropic response did not call required tool ${request.toolName}.`,
    );
  }
}

export function createAnthropicAcquisitionReasoningModel(
  apiKey = process.env.ANTHROPIC_API_KEY,
) {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is required for the Acquisition Lens reasoning engine.",
    );
  }
  return new AnthropicAcquisitionReasoningModel(new Anthropic({ apiKey }));
}
