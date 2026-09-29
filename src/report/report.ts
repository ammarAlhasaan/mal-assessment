import type {Account} from "../ledger/ledger.ts";
import type {ReplayResult} from "../replay/types.ts";
import type {Report} from "./types.ts";

export function buildReport(accounts: readonly Account[], result: ReplayResult): Report {
    throw new Error("Not implemented");
}
