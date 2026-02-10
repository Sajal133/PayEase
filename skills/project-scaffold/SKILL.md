---
name: project-scaffold
description: Automates PayEase project scaffolding including directory structure, config files, and monorepo setup.
---

# Project Scaffold Skill

## Overview
This skill automates the initial setup of the PayEase project:
- Creates directory structure for backend/frontend
- Generates configuration files (.env.example, tsconfig, etc.)
- Sets up monorepo with proper workspace configuration

## Usage

### Quick Start
```bash
python3 scripts/scaffold.py --project-root /path/to/project
```

### What It Creates
```
/project-root
├── apps/
│   ├── api/          # Express.js backend
│   └── web/          # React/Vite frontend
├── packages/
│   └── shared/       # Shared types and utilities
├── directives/       # SOPs
├── execution/        # Deterministic scripts
├── .tmp/             # Temporary files
├── package.json      # Root package.json (workspaces)
├── .env.example
├── .gitignore
└── README.md
```

## Resources

### scripts/scaffold.py
Main scaffolding script that creates the project structure.

### assets/
- `package.json.template` - Root package.json template
- `tsconfig.json.template` - TypeScript configuration

## Integration
After running this skill:
1. Run `npm install` to install dependencies
2. Copy `.env.example` to `.env`
3. Start development with `npm run dev`
