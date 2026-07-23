import { SupabaseBackedProvider } from "./base";
import type { StoreName } from "./types";

export class FlipkartProvider extends SupabaseBackedProvider {
  readonly store: StoreName = "Flipkart";
}
