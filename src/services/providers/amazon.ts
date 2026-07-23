import { SupabaseBackedProvider } from "./base";
import type { StoreName } from "./types";

// Mock Amazon provider. Swap `search()` for a Product Advertising API
// call when credentials are available — the return shape is already
// standardized.
export class AmazonProvider extends SupabaseBackedProvider {
  readonly store: StoreName = "Amazon";
}
