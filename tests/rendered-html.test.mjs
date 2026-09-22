import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the electronic pet inspection app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /电子宠物检测/);
  assert.match(html, /HANHAN CARE LAB/);
  assert.match(html, /型号识别/);
  assert.match(html, /外观扫描/);
  assert.match(html, /安全检查/);
  assert.match(html, /数据检查/);
  assert.match(html, /人工复核/);
  assert.match(html, /生成状态卡/);
  assert.match(html, /用户选择去向/);
  assert.match(html, /正规回收/);
  assert.match(html, /暂不决定/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("uses the finished app metadata and local stylesheet", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /title:\s*"电子宠物检测状态流转中心"/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(page, /const phases: Phase\[\] = \[/);
  assert.match(page, /const destinations = \[/);
  assert.match(page, /人工翻面补拍/);
  assert.match(page, /低功率通电/);
  assert.match(page, /功能测试/);
  assert.match(page, /未授权时跳过，不默认查看私人内容/);
  assert.match(page, /不把本地重置视为云端数据也已删除/);
  assert.match(page, /\/hanhan-ui\.png/);

  assert.match(css, /--forest/);
  assert.match(css, /--amber/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|codex-preview/);

});

test("keeps the starter preview disposable", async () => {
  const packageJson = await readFile(new URL("package.json", templateRoot), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
