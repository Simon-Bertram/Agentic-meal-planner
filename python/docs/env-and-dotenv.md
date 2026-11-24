# Loading secrets from `.env` (uv + python-dotenv)

A short guide you can repeat on any Python project that needs API keys
(OpenAI, etc.) without hardcoding them in source.

## What a `.env` file is

A `.env` file in the project root holds environment variables as
`KEY=value` lines. It is for **local secrets** (API keys, tokens). Keep
it out of git so keys never land in the repo history.

Example (placeholders only):

```env
OPENAI_API_KEY=sk-your-key-here
```

## Create the files

1. Create `.env` in the project root with your real key.
2. Optionally create `.env.example` with empty or fake values so others
   know which variables are required:

   ```env
   OPENAI_API_KEY=
   ```

3. Ignore the real secrets file in git:

   ```gitignore
   .env
   ```

## Add the package (uv)

```bash
uv add python-dotenv
```

Import name is `dotenv`, package name on PyPI is `python-dotenv`.

## Mental model: load vs read

Two separate steps:

1. **Load** — `load_dotenv()` reads `.env` and copies each key into the
   process environment (`os.environ`).
2. **Read** — something then looks those keys up. That can be:
   - your code: `os.getenv("OPENAI_API_KEY")`
   - a library: e.g. `OpenAI()` looks up `OPENAI_API_KEY` for you

Until something loads `.env`, Python does not know about those values.

## When do you need `import os`?

Only when **your** code calls `os.getenv(...)` or reads `os.environ`.

`load_dotenv()` does not require `import os`. If the OpenAI SDK (or
another library) reads the variable for you, you can skip `os` entirely.

### Prefer this for OpenAI

```python
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()  # reads OPENAI_API_KEY from the environment
```

### When you need `os` yourself

Use this for custom vars no library reads for you (or if you want to
pass the key explicitly):

```python
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
```

Call `load_dotenv()` **before** you create the client or read env vars.

## Verify

From the project root:

```bash
uv run python -c "from meal_planner.get_completion import client; print(bool(client.api_key))"
```

`True` means a key was found. Do not print the key itself.

## Optional: load without python-dotenv in code

uv can inject a file for a single command:

```bash
uv run --env-file .env python your_script.py
```

That is useful for one-off scripts. For an app that always needs the
key, calling `load_dotenv()` in code is the usual approach.

## Checklist for a new project

1. Add `.env` to `.gitignore`.
2. Create `.env` with `OPENAI_API_KEY=...` (and `.env.example` if useful).
3. Run `uv add python-dotenv`.
4. Call `load_dotenv()` early, then construct clients / read vars.
5. Confirm with a `uv run` smoke check that does not print secrets.
