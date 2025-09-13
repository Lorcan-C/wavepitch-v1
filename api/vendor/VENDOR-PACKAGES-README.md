# Vendored Python Packages

This directory contains vendored Python packages as a fallback if they become unavailable on PyPI.

## Packages Stored

- `genagent-0.2.7-py3-none-any.whl` - Core memory management package
- `supabase-2.3.4-py3-none-any.whl` - Database client
- `openai-1.51.2-py3-none-any.whl` - OpenAI API client

## Usage

### Primary (use PyPI):

```bash
pip install -r requirements.txt
```

### Fallback (use vendored):

```bash
pip install -r api/vendor/requirements-vendored.txt
```

### Vercel Deployment

Vercel will first try to install from PyPI. If packages are unavailable, you can:

1. Update `requirements.txt` to point to vendored files
2. Or use a build script that tries PyPI first, falls back to vendor

## Why Vendor These Packages?

- **genagent**: Small package, single author, could be removed
- **supabase**: Core dependency for database access
- **openai**: Critical for embeddings generation

## Updating Vendored Packages

```bash
# Download new versions
pip download genagent==NEW_VERSION --no-deps --dest api/vendor/

# Update requirements-vendored.txt with new filenames
```
