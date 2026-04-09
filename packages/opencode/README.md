# opencli

Install globally:

```bash
npm install -g opencli
```

If you typed `npm install -g openci`, use `opencli` instead.

Run it from your terminal:

```bash
opencli
```

The npm package is not published yet, and a raw GitHub npm install does not work yet because the repo root is still a Bun workspace monorepo.

Use the source workflow for now:

```bash
git clone https://github.com/GordonFreeman21/OpenCLI.git
cd OpenCLI
bun install --ignore-scripts
bun run dev
```

Local backends:

- `ollama/*`
- `lmstudio/*`

Examples:

```bash
opencli --model ollama/llama3.2
opencli --model lmstudio/qwen2.5-coder
opencli ollama
opencli lmstudio
opencli models
```
