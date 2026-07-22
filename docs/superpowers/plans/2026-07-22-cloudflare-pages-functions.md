# Cloudflare Pages Functions Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a parallel Cloudflare Pages Functions deployment that preserves the existing Cloudflare Worker while allowing `da.haotab.link` to remain on Tencent Cloud DNS.

**Architecture:** Keep `src/worker.ts` and the existing Worker deployment unchanged as a rollback target. Add a Pages advanced-mode entry that reuses the same Hono Cloudflare application, serves Pages static assets through `env.ASSETS`, and binds the existing KV namespace as `CACHE`. Build the Pages `_worker.js` into an ignored output directory and deploy it as a separate `dailyhot-api-pages` project.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers Runtime, Cloudflare Pages Functions advanced mode, Wrangler, Workers KV, pnpm.

---

### Task 1: Add the Pages advanced-mode entry

**Files:**

- Create: `src/pages-worker.ts`

- [ ] **Step 1: Add a Pages binding type**

Define the existing `CACHE` KV binding and the Pages-provided `ASSETS` fetcher binding.

- [ ] **Step 2: Reuse the existing Cloudflare Hono application**

Import `app.cloudflare.tsx`, configure the same Cloudflare KV cache provider, and pass the Pages execution context into `app.fetch()`.

- [ ] **Step 3: Preserve static asset behavior**

Call `env.ASSETS.fetch(request)` before Hono routing and return the asset when its status is not `404`. Fall back to Hono for `/`, `/all`, API routes, RSS, and `robots.txt`.

### Task 2: Add isolated Pages configuration and build output

**Files:**

- Create: `pages/wrangler.toml`
- Create: `scripts/build-pages.mjs`
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Add the Pages project configuration**

Configure `name = "dailyhot-api-pages"`, `pages_build_output_dir = "./dist"`, the current compatibility date, `nodejs_compat`, existing environment variables, and the existing KV namespace under binding name `CACHE`.

- [ ] **Step 2: Add a deterministic Pages build script**

Use Wrangler's Worker bundler in dry-run mode to bundle `src/pages-worker.ts`, copy public assets into `pages/dist`, and rename the generated module to `pages/dist/_worker.js` for Pages advanced mode.

- [ ] **Step 3: Ignore generated Pages artifacts**

Ignore `pages/dist` and the intermediate `pages/.worker-build` directory while keeping `pages/wrangler.toml` tracked.

- [ ] **Step 4: Add package commands**

Add `cf:pages:build`, `cf:pages:dev`, and `cf:pages:deploy` commands without changing `cf:deploy` or the existing Worker commands.

### Task 3: Align KV configuration and document deployment

**Files:**

- Modify: `wrangler.toml`
- Modify: `README.md`

- [ ] **Step 1: Correct the Worker KV binding name**

Change the existing Worker configuration binding from `KV` to `CACHE` so it matches `env.CACHE` in `src/worker.ts`.

- [ ] **Step 2: Document the parallel Pages workflow**

Document build, local preview, initial Pages project deployment, external custom subdomain setup, and the Tencent DNSPod CNAME record. State explicitly that the existing Worker remains available for rollback.

### Task 4: Verify parity before DNS changes

**Files:**

- Test: `src/pages-worker.ts`
- Test: `pages/wrangler.toml`
- Test: `scripts/build-pages.mjs`

- [ ] **Step 1: Run static checks**

Run `pnpm build` and `pnpm lint`. Expected result: both commands exit successfully.

- [ ] **Step 2: Build the Pages artifact**

Run `pnpm cf:pages:build`. Expected result: `pages/dist/_worker.js`, its source map, and all files from `public/` exist.

- [ ] **Step 3: Start Pages locally**

Run `pnpm cf:pages:dev`. Expected result: Wrangler starts a local Pages server with `CACHE`, `ASSETS`, variables, and `nodejs_compat` available.

- [ ] **Step 4: Exercise representative routes**

Request `/`, `/all`, `/robots.txt`, `/favicon.png`, `/weibo`, and `/weibo?rss=true`. Expected result: HTML, JSON, text, image, cached API JSON, and RSS responses match the existing Worker behavior.

- [ ] **Step 5: Keep DNS unchanged until production verification**

Deploy the Pages project and test its `*.pages.dev` hostname before adding `da.haotab.link` in Pages and the CNAME record in Tencent DNSPod.
