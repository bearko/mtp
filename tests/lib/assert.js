/**
 * @spec SPEC-036 §6 最小アサーションライブラリ（Node.js 単体で動く）
 *
 * describe / it でグループ化し、失敗時は process.exitCode = 1 にする。
 * 他のテストフレームワーク（mocha/jest など）に依存しないことで、
 * プロジェクトに package.json を増やさずに済む。
 */

let _stats = { passed: 0, failed: 0, skipped: 0 };
let _currentDesc = "";

function _ts() {
  return new Date().toISOString().slice(11, 19);
}

function describe(title, fn) {
  const prev = _currentDesc;
  _currentDesc = prev ? `${prev} > ${title}` : title;
  console.log(`\x1b[36m▸\x1b[0m ${_currentDesc}`);
  try {
    fn();
  } catch (e) {
    console.log(`  \x1b[31m[SETUP FAILED] ${e.message}\x1b[0m`);
    process.exitCode = 1;
  } finally {
    _currentDesc = prev;
  }
}

function it(name, fn) {
  const label = `  - ${name}`;
  try {
    const maybePromise = fn();
    if (maybePromise && typeof maybePromise.then === "function") {
      return maybePromise.then(
        () => { _stats.passed += 1; console.log(`\x1b[32m✔\x1b[0m ${label}`); },
        (e) => { _stats.failed += 1; process.exitCode = 1; console.log(`\x1b[31m✘\x1b[0m ${label}\n    ${e.message}`); }
      );
    }
    _stats.passed += 1;
    console.log(`\x1b[32m✔\x1b[0m ${label}`);
  } catch (e) {
    _stats.failed += 1;
    process.exitCode = 1;
    console.log(`\x1b[31m✘\x1b[0m ${label}\n    ${e.message}`);
  }
}

function skip(name) {
  _stats.skipped += 1;
  console.log(`  - ${name} \x1b[33m(skipped)\x1b[0m`);
}

function assertEq(actual, expected, msg) {
  if (actual === expected) return;
  throw new Error(`${msg || "assertEq"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function assertDeepEq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) return;
  throw new Error(`${msg || "assertDeepEq"}: expected ${b}, got ${a}`);
}
function assert(cond, msg) {
  if (cond) return;
  throw new Error(msg || "assert failed");
}
function assertNear(actual, expected, tol, msg) {
  if (typeof actual !== "number" || typeof expected !== "number") {
    throw new Error(`${msg || "assertNear"}: non-number ${actual}, ${expected}`);
  }
  if (Math.abs(actual - expected) <= (tol || 0.0001)) return;
  throw new Error(`${msg || "assertNear"}: expected ~${expected} (±${tol}), got ${actual}`);
}
function assertMatch(str, re, msg) {
  if (re.test(String(str))) return;
  throw new Error(`${msg || "assertMatch"}: ${str} does not match ${re}`);
}

function _summary() {
  const total = _stats.passed + _stats.failed + _stats.skipped;
  const c = _stats.failed > 0 ? "\x1b[31m" : "\x1b[32m";
  console.log(`\n${c}── ${_stats.passed}/${total} passed, ${_stats.failed} failed, ${_stats.skipped} skipped ──\x1b[0m\n`);
}

process.on("beforeExit", _summary);

module.exports = { describe, it, skip, assert, assertEq, assertDeepEq, assertNear, assertMatch };
