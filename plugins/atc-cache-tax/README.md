# ATC Cache Tax Plugin

> [!IMPORTANT]
> This is a Claude Code **mod**. It requires **Claude Code 2.1.287 or newer** and doesn't run in GitHub Copilot. It works on Windows, macOS and Linux.

## Overview

atc-cache-tax stops you from paying to re-send a long conversation after a break without knowing it, and can keep the conversation cached while you're away.

- **The guard.** When the prompt cache has expired and the conversation is big, your next prompt is held once, with what it will cost. Press Enter again to send it.
- **Keep-warm.** `/atc-keepwarm 2h` keeps the cache warm while you're at lunch or in a meeting, with small pings that stop by themselves when they no longer help.
- **The card.** `/atc-cache-tax` shows whether the cache is warm, how big the conversation is and what re-caching it costs.

## Why this matters

Every prompt sends the whole conversation to the model again: the system prompt, `CLAUDE.md`, the files Claude read, every answer so far. Claude Code keeps that conversation in the API's **prompt cache**, so the part that was already sent is read back cheaply instead of being processed again:

| What happens | Price, as a share of the normal input price |
|--------------|-------------------------------------------|
| Reading from the cache | 0.1x (0.05x on Opus 5.5 and Sonnet 5.5, 0.025x on Fable 5.1) |
| Writing to the cache, five-minute lifetime | 1.25x |
| Writing to the cache, one-hour lifetime | 2x |

A cache entry lives for **one hour** on a Claude subscription, and for **five minutes** with an API key, Bedrock, Vertex or Foundry. Each use starts the clock again. You can change it with the `promptCacheTtl` setting or the `CLAUDE_CODE_PROMPT_CACHE_TTL` environment variable.

After a longer break the entry is gone. The next prompt then writes the whole conversation to the cache again, at the write price. For a 200k-token conversation on Opus 5.5:

| | Cost |
|-|------|
| A prompt while the cache is warm (read) | about $0.04 |
| The first prompt after the cache expired (one-hour write) | about $1.60 |

That's 40 times as much, for a prompt that looks just like the one before. On a subscription you don't pay dollars, but it counts against your plan's usage limits the same way. The dollar figures in this mod are estimates at list prices.

The guard makes that cost visible before it happens, so you can decide: send it anyway, or `/clear` and start fresh. Keep-warm avoids it for breaks you know about.

## The guard

When all of these are true, a prompt you type is held once:

- Claude has answered at least once in this session, so the mod knows the conversation's size.
- The cache's lifetime has passed since the last request.
- The conversation is 50k tokens or more. Below that, a rewrite is cheap.

```text
● Prompt dropped by a hook: atc-cache-tax held this prompt: the prompt cache expired 12m ago, so this
  prompt writes 182k tokens to it again (about $1.46). Press Enter to send it anyway, or /clear to start over.
```

Your prompt stays in the prompt box. Press Enter to send it. Only one prompt is held each time the cache expires, so the next one goes through even if you changed it. Slash commands are never held.

Set the guard to `notice` to send the prompt straight away with the cost as a notice, or to `off`.

## Keep-warm

```text
/atc-keepwarm 2h
```

While you're away, a ping goes out shortly before the cache would expire: after 50 minutes with the one-hour lifetime, after 4 minutes with the five-minute one. A ping is a one-line question over the conversation ("reply with just: ok"). It reads the cache, so it costs the read price, about $0.02 to $0.03 for a 120k-token conversation on Opus 5.5. It's never added to the conversation, and it never runs while Claude is working.

While keep-warm runs, a row above the prompt shows how it's going:

```text
♨ keep-warm cache warm · next ping in 38m · 1h22m left · 1 ping, $0.03   off
```

It stops by itself, with a notice, when:

- its time is up,
- a ping read nothing from the cache, because the entry had already expired,
- a ping had to write a lot to the cache (10% or more of what it read), so pings cost more than they save,
- your first prompt after a ping still had to write the whole conversation again, so the pings didn't keep the cache warm,
- two pings in a row failed.

When the cache has already expired, keep-warm doesn't ping: that would cost the full rewrite. Pings start again after your next prompt.

**When it pays off.** With the one-hour lifetime, a two-hour break costs two pings instead of one rewrite. With the five-minute lifetime a ping goes out every 4 minutes, so keep-warm only pays off for breaks up to roughly an hour (less on older models, where reads cost more). For a longer break, let the cache expire.

> [!NOTE]
> Claude Code sends pings like this with the five-minute lifetime, and it isn't documented whether a ping's read also extends a one-hour entry. On a Claude subscription it does: in a test, a 177k-token conversation stayed cached through a break of over an hour with one ping, and the next prompt didn't have to write it to the cache again. Other setups may behave differently, so the mod keeps checking. If a later ping reads nothing, or your next prompt has to write the whole conversation again, keep-warm stops and tells you so. Every rewrite is counted under "Cache rewrites" in `/atc-cache-tax`.

## Install

```text
/plugin install atc-cache-tax --marketplace atc-net/atc-agentic-toolkit
```

Answer `y` to add the marketplace and pick a scope. The mod is active straight away, with no restart.

## Commands

| Command | Does |
|---------|------|
| `/atc-cache-tax` | Shows the cache (warm or expired, time left, its lifetime and why), the conversation's size, what re-caching it costs, the guard, keep-warm, and the rewrites this session |
| `/atc-cache-tax guard <mode>` | Sets the guard for this session only: `ask` holds the prompt once and shows the cost, so you choose; `notice` sends it and shows the cost; `off` does nothing. The `guard` setting in `/config` is the lasting choice. `/atc-cache-tax guard` alone shows the current mode. |
| `/atc-keepwarm 90m` | Keeps the cache warm for 90 minutes. Takes `90m`, `2h`, `2h30m`, up to `12h`, or `always` |
| `/atc-keepwarm off` | Stops keep-warm |
| `/atc-keepwarm status` | Same as `/atc-cache-tax` |

Click **off** on the band to stop keep-warm too.

## Settings

Set in `/config`, or under `pluginConfigs` in your settings:

| Setting | Values | Default |
|---------|--------|---------|
| `guard` | `ask`: hold the prompt once and show the cost, so you choose. `notice`: send it and show the cost. `off`: nothing. | `ask` |
| `cacheTtl` | `auto`: worked out the way Claude Code does it. `5m` or `1h`: the lifetime you know you have. | `auto` |

With `auto`, the lifetime comes from, in order: `FORCE_PROMPT_CACHING_5M`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, the `promptCacheTtl` setting, `ENABLE_PROMPT_CACHING_1H`, and finally one hour on a Claude subscription and five minutes otherwise. When the mod sees the cache still warm more than five minutes after a request, it takes the lifetime to be one hour. `/atc-cache-tax` says which one it uses and why.

## Limits

- **Estimates.** Prices are list prices per model. On a subscription the cost is plan usage, not money.
- **Over your plan's limit.** When a subscription draws on usage credits, Claude Code drops to the five-minute lifetime. The mod can't see that; set `cacheTtl` to `5m` while it lasts.
- **It knows the conversation once Claude has answered.** After a restart, `--resume`, `--continue`, or moving the conversation to the background and back, the guard waits for the next answer before it can judge, and keep-warm waits for it before it pings. A reload of the mod, after an update for example, keeps what it knew.
- **Model and effort switches.** Switching model or effort usually starts a new cache. The guard doesn't know about that switch; keep-warm notices it at its next ping and stops.
- **Keep-warm runs only while the session is open.** Closing Claude Code ends it. `always` runs until `/atc-keepwarm off`.
- **Prompt caching off.** With `DISABLE_PROMPT_CACHING` set, the guard does nothing and keep-warm refuses to start.

## Try it

The one-hour lifetime is slow to test, so force the five-minute one for the test session. In a clone of any repository with some docs to read:

PowerShell:

```powershell
$env:FORCE_PROMPT_CACHING_5M = "1"; claude
```

Bash or zsh:

```bash
FORCE_PROMPT_CACHING_5M=1 claude
```

**The guard**

1. `Read every file under docs/ and give me a one-paragraph summary of each`. That builds a conversation of 50k tokens or more.
2. `/atc-cache-tax`. It shows `Cache: warm, about 5m left (lifetime 5m: FORCE_PROMPT_CACHING_5M is set)`, the context size and the rewrite cost. If the context is under 50k, ask Claude to read more files.
3. Wait 6 minutes, then type `what was the longest file?`. The prompt is held with the cost, and stays in the prompt box.
4. Press Enter. It's sent.

**Keep-warm**

5. `/atc-keepwarm 20m`. The band shows `♨ keep-warm cache warm · next ping in 4m · 20m left · 0 pings`.
6. Wait about 5 minutes. The band shows `1 ping` and the next ping in about 4 minutes.
7. Wait another 5 minutes, then type a prompt. It isn't held, because the cache stayed warm.
8. `/atc-keepwarm off`, or click **off** on the band.

Close the session afterwards so the forced five-minute lifetime doesn't stay. In PowerShell, run `Remove-Item Env:FORCE_PROMPT_CACHING_5M` before starting Claude again.

## Turn it off

`/plugin` → atc-cache-tax → Disable, or from a shell `claude plugin disable atc-cache-tax@atc-agentic-toolkit`. Turn it back on with Enable, or `claude plugin enable atc-cache-tax@atc-agentic-toolkit`.

## Develop

Run a local copy for one session without installing it, using the absolute path to your clone. Saving a file in the folder reloads the mod.

```bash
claude --plugin-dir <path-to-clone>/plugins/atc-cache-tax
```

Check and test:

```bash
claude plugin validate plugins/atc-cache-tax
claude plugin test plugins/atc-cache-tax
```
