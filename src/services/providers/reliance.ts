import { SupabaseBackedProvider } from "./base";
import type { StoreName } from "./types";

export class RelianceDigitalProvider extends SupabaseBackedProvider {
  readonly store: StoreName = "Reliance Digital";
}
