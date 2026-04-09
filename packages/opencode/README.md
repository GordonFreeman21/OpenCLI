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

GitHub install fallback:

```bash
npm install -g github:GordonFreeman21/OpenCLI.git
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
