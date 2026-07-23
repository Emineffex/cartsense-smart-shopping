import { SupabaseBackedProvider } from "./base";
import type { StoreName } from "./types";

export class CromaProvider extends SupabaseBackedProvider {
  readonly store: StoreName = "Croma";
}
