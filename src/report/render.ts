import {format} from "../money/money.ts";
import type {AccountBalance, DayReport, Report} from "./types.ts";

function balances(rows: readonly AccountBalance[]): string[] {
    return rows.map(({accountId, balance}) => `${accountId} ${format(balance)}`);
}

function section(title: string, lines: readonly string[]): string[] {
    return lines.length === 0 ? [`  ${title}: none`] : [`  ${title}:`, ...lines.map((line) => `    ${line}`)];
}

function renderDay(day: DayReport): string[] {
    const events = day.events.map((event) =>
        event.eventDay < day.day ? `${event.eventId} (late: event day ${event.eventDay})` : event.eventId);

    return [
        `Day ${day.day}`,
        `  Events: ${events.length === 0 ? "none" : events.join(", ")}`,
        ...section("Closing ledger balance", balances(day.balances)),
        ...section("Fees assessed", day.fees.map((fee) =>
            `${fee.eventId} ${fee.accountId} ${format(fee.amount)} value day ${fee.valueDay}`)),
        ...(day.interest.length === 0 ? [] : section("Interest capitalized", day.interest.map((entry) =>
            `${entry.eventId} ${entry.accountId} ${format(entry.amount)}`))),
        ...section("Authorizations", day.authorizations.map((record) =>
            `${record.authorizationId} ${record.accountId} ${format(record.amount)} ${record.outcome}`)),
        ...section("Errors", day.errors.map((error) =>
            `${error.eventId} settlement ${error.authorizationId} ${error.accountId} ${format(error.amount)} REJECTED: no active authorization`)),
    ];
}

/** Deterministic text: one section per day, then the final value-dated balances. */
export function renderReport(report: Report): string {
    return [
        ...report.days.flatMap((day) => [...renderDay(day), ""]),
        "Final value-dated closing ledger balances",
        ...report.finalBalances.map(({day, balances: rows}) => `  Day ${day}: ${balances(rows).join(", ")}`),
    ].join("\n");
}
