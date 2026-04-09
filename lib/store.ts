import type { IntakePayload } from "./ella";

const globalStore = globalThis as typeof globalThis & {
  __exitdeskIntakeStore?: Map<string, IntakePayload>;
};

export const intakeStore: Map<string, IntakePayload> =
  globalStore.__exitdeskIntakeStore ??
  (globalStore.__exitdeskIntakeStore = new Map());
