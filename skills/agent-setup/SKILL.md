---
name: agent-setup
description: Bootstraps the agent system architecture by creating necessary directories and mirroring instruction files. Use when starting a new project or resetting the agent environment.
---

# Agent Setup

## Overview

This skill sets up the 3-layer agent architecture (Directives, Orchestration, Execution) and mirrors the `AGENTS.md` instructions to `CLAUDE.md` and `GEMINI.md`.

## Quick Start

To setup the agent environment:

1. Run the setup script:
   ```bash
   python3 skills/agent-setup/scripts/setup_agent.py
   ```

2. This will:
   - Create `directives/`, `execution/`, and `.tmp/` directories.
   - Copy `AGENTS.md` to `CLAUDE.md` and `GEMINI.md`.
   - Create `.env` and `.gitignore`.

## Resources

- **scripts/setup_agent.py**: The main automation script.
- **assets/AGENTS.md**: The source instruction file.
