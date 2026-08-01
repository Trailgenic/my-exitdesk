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
    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      system: request.systemPrompt,
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
      tool_choice: { type: "tool", name: request.toolName },
    });

    const toolUse = response.content.find(
      (block) =>
        block.type === "tool_use" && block.name === request.toolName,
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(
        `Anthropic response did not call required tool ${request.toolName}.`,
      );
    }
    return toolUse.input;
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
