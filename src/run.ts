import {ASSESSMENT_ACCOUNTS, ASSESSMENT_EVENTS} from "./replay/events.ts";
import {replay} from "./replay/replay.ts";
import {buildReport} from "./report/report.ts";
import {renderReport} from "./report/render.ts";

console.log(renderReport(buildReport(ASSESSMENT_ACCOUNTS, replay(ASSESSMENT_ACCOUNTS, ASSESSMENT_EVENTS))));
