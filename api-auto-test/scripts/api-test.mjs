#!/usr/bin/env node
/**
 * api-test.mjs — 本地后端接口自动化测试执行器
 *
 * 存在的意义：Agent 的 shell_exec 白名单不含 curl，但含 node。
 * 本脚本以 curl 风格的输入描述请求，用 Node 原生 fetch 向 localhost 发起 HTTP 调用并断言。
 *
 * 用法：
 *   node api-test.mjs <config.json>                 按 JSON 配置批量执行
 *   node api-test.mjs --json '<inline json>'        直接传内联 JSON 配置
 *   node api-test.mjs --curl 'curl -X POST ...'     执行单条 curl 风格请求
 *   node api-test.mjs --health http://localhost:8080  探活（GET，只报告状态）
 *
 * 退出码：0=全部通过  1=存在失败  2=用法/运行错误
 */

import fs from "node:fs";

const argv = process.argv.slice(2);

function usageError(msg) {
  console.error(`[api-test] 错误：${msg}`);
  console.error(
    "[api-test] 用法：node api-test.mjs <config.json> | --json '<json>' | --curl '<curl cmd>' | --health <url>",
  );
  process.exit(2);
}

function getFlag(name) {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
}

// ---------------- 参数解析 ----------------
let config;
const healthUrl = getFlag("--health");
const curlArg = getFlag("--curl");
const jsonArg = getFlag("--json");
const verbose = argv.includes("--verbose") || argv.includes("-v");

try {
  if (healthUrl) {
    config = { cases: [{ name: "health", url: healthUrl, method: "GET" }] };
  } else if (curlArg) {
    config = { cases: [{ name: "curl", curl: curlArg }] };
  } else if (jsonArg) {
    config = JSON.parse(jsonArg);
  } else {
    const positional = argv.find((a) => !a.startsWith("-"));
    if (!positional) usageError("缺少配置文件路径或 --json/--curl/--health 参数");
    config = JSON.parse(fs.readFileSync(positional, "utf8"));
  }
} catch (e) {
  usageError(`解析配置失败：${e.message}`);
}

if (!config || !Array.isArray(config.cases) || config.cases.length === 0) {
  usageError("配置必须包含非空的 cases 数组");
}

const baseUrl = config.baseUrl || "";
const defaults = config.defaults || {};

// ---------------- curl 解析 ----------------
function tokenizeCurl(str) {
  const tokens = [];
  let cur = "";
  let quote = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === "\\" && quote === '"' && str[i + 1] !== undefined) {
        cur += str[++i];
      } else if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (cur) tokens.push(cur);
      cur = "";
    } else if (ch === "\\" && str[i + 1] !== undefined) {
      // 行尾续行符或转义
      const next = str[i + 1];
      if (next === "\n") {
        i++;
      } else {
        cur += next;
        i++;
      }
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function parseCurl(cmd) {
  const tokens = tokenizeCurl(cmd.trim());
  if (tokens[0] === "curl") tokens.shift();
  const out = { method: undefined, url: undefined, headers: {}, body: undefined };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = () => tokens[++i];
    switch (t) {
      case "-X":
      case "--request":
        out.method = next();
        break;
      case "-H":
      case "--header": {
        const h = next() || "";
        const idx = h.indexOf(":");
        if (idx > -1) out.headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
        break;
      }
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-binary":
      case "--data-ascii":
        out.body = next();
        break;
      case "-u":
      case "--user":
        out.headers["Authorization"] = "Basic " + Buffer.from(next() || "").toString("base64");
        break;
      case "-b":
      case "--cookie":
        out.headers["Cookie"] = next();
        break;
      case "-e":
      case "--referer":
        out.headers["Referer"] = next();
        break;
      case "--url":
        out.url = next();
        break;
      case "-G":
      case "--get":
        out.method = out.method || "GET";
        break;
      case "--compressed":
      case "-k":
      case "--insecure":
      case "-L":
      case "--location":
      case "-s":
      case "--silent":
        break; // 忽略的开关
      default:
        if (!out.url && /^https?:\/\//i.test(t)) out.url = t;
        break;
    }
  }
  if (!out.method) out.method = out.body ? "POST" : "GET";
  return out;
}

// ---------------- URL 构建 ----------------
function buildUrl(c) {
  let url = c.url || (baseUrl.replace(/\/$/, "") + "/" + String(c.path || "").replace(/^\//, ""));
  const q = c.query;
  if (q && typeof q === "object") {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v !== undefined && v !== null) usp.append(k, String(v));
    }
    const qs = usp.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return url;
}

// ---------------- 点路径取值 ----------------
function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

// ---------------- 执行单条用例 ----------------
async function runCase(c, index) {
  const merged = c.curl ? { ...c, ...parseCurl(c.curl) } : { ...c };
  const method = (merged.method || "GET").toUpperCase();
  const url = buildUrl(merged);
  const headers = { ...(defaults.headers || {}), ...(merged.headers || {}) };

  let body = merged.body;
  if (body && typeof body === "object") {
    body = JSON.stringify(body);
    if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  // 移除空值 header（便于测试"不带某头"的场景）
  for (const k of Object.keys(headers)) {
    if (headers[k] === "" || headers[k] == null) delete headers[k];
  }

  const timeoutMs = merged.timeoutMs || defaults.timeoutMs || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  const result = { index, name: c.name || `${method} ${url}`, method, url };

  try {
    const resp = await fetch(url, { method, headers, body, signal: controller.signal });
    const elapsed = Date.now() - started;
    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }

    result.status = resp.status;
    result.elapsed = elapsed;
    result.bodyPreview = text.length > 500 ? text.slice(0, 500) + "…" : text;

    // 断言
    const failures = [];
    const expect = merged.expect || {};

    if (expect.status !== undefined) {
      const ok = Array.isArray(expect.status)
        ? expect.status.includes(resp.status)
        : expect.status === resp.status;
      if (!ok) failures.push(`期望状态码 ${JSON.stringify(expect.status)}，实际 ${resp.status}`);
    }

    if (Array.isArray(expect.bodyContains)) {
      for (const needle of expect.bodyContains) {
        if (!text.includes(needle)) failures.push(`响应体未包含 "${needle}"`);
      }
    }

    if (expect.jsonEquals && typeof expect.jsonEquals === "object") {
      if (json === undefined) {
        failures.push("期望 JSON 断言，但响应体不是合法 JSON");
      } else {
        for (const [p, want] of Object.entries(expect.jsonEquals)) {
          const got = getByPath(json, p);
          if (JSON.stringify(got) !== JSON.stringify(want)) {
            failures.push(`字段 ${p} 期望 ${JSON.stringify(want)}，实际 ${JSON.stringify(got)}`);
          }
        }
      }
    }

    if (expect.maxTimeMs !== undefined && elapsed > expect.maxTimeMs) {
      failures.push(`响应耗时 ${elapsed}ms 超过上限 ${expect.maxTimeMs}ms`);
    }

    // health 模式：无 expect，仅按 2xx/3xx 判定
    if (!merged.expect && (healthUrl || c.name === "health")) {
      if (resp.status < 400) result.note = "服务在线";
      else failures.push(`探活返回状态码 ${resp.status}`);
    }

    result.pass = failures.length === 0;
    result.failures = failures;
  } catch (e) {
    result.pass = false;
    result.elapsed = Date.now() - started;
    const isAbort = e.name === "AbortError";
    result.failures = [isAbort ? `请求超时（>${timeoutMs}ms）` : `请求失败：${e.message}`];
    if (isAbort || /ECONNREFUSED|ENOTFOUND|fetch failed/i.test(e.message)) {
      result.hint = "无法连接目标服务，请确认后端已启动且端口/baseUrl 正确（先跑 --health）。";
    }
  } finally {
    clearTimeout(timer);
  }

  return result;
}

// ---------------- 主流程 ----------------
function printReport(results) {
  console.log("\n========== 接口测试报告 ==========");
  let pass = 0;
  for (const r of results) {
    const tag = r.pass ? "✅ PASS" : "❌ FAIL";
    if (r.pass) pass++;
    console.log(
      `${tag} | #${r.index + 1} ${r.name} | ${r.method} ${r.url} | ` +
        (r.status !== undefined ? `状态 ${r.status} | ` : "") +
        `${r.elapsed}ms`,
    );
    if (verbose && r.bodyPreview) console.log(`        响应: ${r.bodyPreview}`);
    if (!r.pass) {
      for (const f of r.failures) console.log(`        ✗ ${f}`);
      if (r.hint) console.log(`        ⚠ ${r.hint}`);
    }
  }
  const fail = results.length - pass;
  console.log("----------------------------------");
  console.log(`汇总：通过 ${pass} / 失败 ${fail} / 总数 ${results.length}`);
  console.log("==================================\n");
  return fail;
}

const results = [];
for (let i = 0; i < config.cases.length; i++) {
  const r = await runCase(config.cases[i], i);
  results.push(r);
}

const failCount = printReport(results);
process.exit(failCount === 0 ? 0 : 1);