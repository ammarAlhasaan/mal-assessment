import type {Account} from "../ledger/ledger.ts";
import type {ReplayEvent, ReplayResult} from "./types.ts";

export function replay(accounts: readonly Account[], events: readonly ReplayEvent[]): ReplayResult {
    throw new Error("Not implemented");
}