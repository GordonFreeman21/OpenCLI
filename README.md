<p align="center">
  <a href="#">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="opencli logo">
    </picture>
  </a>
</p>
<p align="center">The local-first AI coding CLI for Ollama and LM Studio.</p>

---

## Install

```bash
npm install -g opencli
```

If you typed `npm install -g openci`, that will fail because the package name is **opencli**.

Then launch it from your terminal with:

```bash
opencli
```

You can also install with Bun:

```bash
bun add -g opencli
```

The npm package is **not published yet**, and `npm install -g github:GordonFreeman21/OpenCLI.git` does **not** work yet because this repo is still a Bun workspace monorepo.

Until the package is published, use the source workflow instead:

```bash
git clone https://github.com/GordonFreeman21/OpenCLI.git
cd OpenCLI
bun install --ignore-scripts
bun run dev
```

## Local model backends

opencli supports two local OpenAI-compatible backends:

- **Ollama** — default local setup for pulled models
- **LM Studio** — local server on `http://127.0.0.1:1234/v1`

## Quick start

### Ollama

```bash
ollama serve
ollama pull llama3.2
opencli --model ollama/llama3.2
```

### LM Studio

1. Start LM Studio's local server.
2. Load a model in LM Studio.
3. Run:

```bash
opencli --model lmstudio/qwen2.5-coder
```

You can inspect each backend directly:

```bash
opencli ollama
opencli lmstudio
opencli models
```

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **Local AI** | Runs with Ollama and LM Studio |
| 🚀 **Autopilot Mode** | Auto-approve permissions and let the agent work |
| 💡 **Smart Commit** | Generate commit messages from staged changes |
| 📊 **Code Stats** | Inspect local code statistics in the terminal |
| ⏱️ **Focus Mode** | Built-in Pomodoro timer |
| 📋 **Snippet Library** | Save and search snippets locally |
| 🧠 **Context Memory** | Persistent session memory |
| 📝 **Diff Summary** | Summarize git diffs locally |
| 🏥 **Health Check** | Scan a project for common issues |
| 🎨 **Themes** | Switch terminal themes |
| 📤 **Session Export** | Export sessions as Markdown, JSON, or HTML |
| 🎓 **Learning Mode** | Explain actions step by step |
| 🔍 **Smart Search** | Ranked fuzzy code search |
| 🩹 **Quick Fix** | Suggest fixes for diagnostics |

## Common commands

```bash
opencli
opencli --autopilot
opencli --model ollama/codellama
opencli --model lmstudio/qwen2.5-coder
opencli commit
opencli focus
opencli health
opencli search "handleAuth"
opencli ollama
opencli lmstudio
opencli models
```

## Configuration

Create `opencli.json` in your project root or config directory:

```json
{
  "model": "ollama/llama3.2",
  "small_model": "ollama/llama3.2:1b",
  "provider": {
    "ollama": {
      "options": {
        "baseURL": "http://localhost:11434/v1"
      }
    },
    "lmstudio": {
      "options": {
        "baseURL": "http://127.0.0.1:1234/v1"
      }
    }
  }
}
```

Legacy `opencode.json` config files are still recognized for compatibility.

## Why opencli?

- **Local-first** — your code stays on your machine
- **Terminal-native** — launch with `opencli` and work immediately
- **Autonomous** — autopilot can finish tasks with fewer interruptions
- **Flexible** — switch between Ollama and LM Studio locally

---

**MIT License**
