import assert from "node:assert/strict";
import {
  groupByAllowsDrag,
  temporaliteBucket,
  TEMPORALITE_ORDER,
} from "./taches-temporalite";

const ref = new Date("2026-09-17T12:00:00.000Z");

assert.equal(temporaliteBucket(null, ref), "SANS_ECHEANCE");
assert.equal(temporaliteBucket("2026-09-10T12:00:00.000Z", ref), "EN_RETARD");
assert.equal(temporaliteBucket("2026-09-17T08:00:00.000Z", ref), "AUJOURD_HUI");
assert.equal(temporaliteBucket("2026-09-20T12:00:00.000Z", ref), "J7");
assert.equal(temporaliteBucket("2026-10-05T12:00:00.000Z", ref), "J30");
assert.equal(temporaliteBucket("2026-12-01T12:00:00.000Z", ref), "PLUS_TARD");
assert.equal(
  temporaliteBucket("2026-09-10T12:00:00.000Z", ref, { ignoreRetard: true }),
  "PLUS_TARD",
);

assert.ok(TEMPORALITE_ORDER.includes("EN_RETARD"));
assert.equal(groupByAllowsDrag("statut"), true);
assert.equal(groupByAllowsDrag("responsable"), true);
assert.equal(groupByAllowsDrag("temporalite"), false);

console.log("taches-temporalite.test.ts OK");
