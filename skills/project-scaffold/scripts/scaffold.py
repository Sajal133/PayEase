#!/usr/bin/env python3
"""
scaffold.py - PayEase Project Scaffolding Script

Creates the monorepo structure for PayEase with:
- apps/api (Express.js backend)
- apps/web (React/Vite frontend)
- packages/shared (shared types/utilities)
"""

import os
import json
from pathlib import Path

def create_directory_structure(root: Path):
    """Create the monorepo directory structure"""
    
    directories = [
        # Apps
        'apps/api/src/routes',
        'apps/api/src/services',
        'apps/api/src/models',
        'apps/api/src/middleware',
        'apps/api/src/utils',
        'apps/api/tests',
        
        'apps/web/src/components',
        'apps/web/src/pages',
        'apps/web/src/hooks',
        'apps/web/src/utils',
        'apps/web/src/styles',
        'apps/web/public',
        
        # Shared packages
        'packages/shared/src/types',
        'packages/shared/src/utils',
        
        # Agent system
        'directives',
        'execution',
        '.tmp',
        
        # Tests
        'tests/e2e',
    ]
    
    for d in directories:
        (root / d).mkdir(parents=True, exist_ok=True)
        
    print(f"✅ Created {len(directories)} directories")

def create_root_package_json(root: Path):
    """Create root package.json with workspaces"""
    
    package = {
        "name": "payease",
        "version": "0.1.0",
        "private": True,
        "workspaces": [
            "apps/*",
            "packages/*"
        ],
        "scripts": {
            "dev": "npm run dev --workspaces",
            "dev:api": "npm run dev --workspace=apps/api",
            "dev:web": "npm run dev --workspace=apps/web",
            "build": "npm run build --workspaces",
            "test": "npm run test --workspaces",
            "lint": "eslint . --ext .ts,.tsx",
            "format": "prettier --write .",
            "db:migrate": "npm run migrate --workspace=apps/api",
            "db:seed": "npm run seed --workspace=apps/api"
        },
        "devDependencies": {
            "typescript": "^5.3.0",
            "eslint": "^8.55.0",
            "prettier": "^3.1.0",
            "@types/node": "^20.10.0"
        }
    }
    
    with open(root / 'package.json', 'w') as f:
        json.dump(package, f, indent=2)
    
    print("✅ Created root package.json")

def create_api_package_json(root: Path):
    """Create API package.json"""
    
    package = {
        "name": "@payease/api",
        "version": "0.1.0",
        "private": True,
        "scripts": {
            "dev": "nodemon --exec ts-node src/index.ts",
            "build": "tsc",
            "start": "node dist/index.js",
            "test": "jest",
            "migrate": "prisma migrate dev",
            "seed": "ts-node prisma/seed.ts"
        },
        "dependencies": {
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "helmet": "^7.1.0",
            "jsonwebtoken": "^9.0.2",
            "bcryptjs": "^2.4.3",
            "@prisma/client": "^5.7.0",
            "zod": "^3.22.4",
            "dotenv": "^16.3.1"
        },
        "devDependencies": {
            "@types/express": "^4.17.21",
            "@types/cors": "^2.8.17",
            "@types/jsonwebtoken": "^9.0.5",
            "@types/bcryptjs": "^2.4.6",
            "ts-node": "^10.9.2",
            "nodemon": "^3.0.2",
            "jest": "^29.7.0",
            "prisma": "^5.7.0"
        }
    }
    
    with open(root / 'apps/api/package.json', 'w') as f:
        json.dump(package, f, indent=2)
    
    print("✅ Created apps/api/package.json")

def create_web_package_json(root: Path):
    """Create Web package.json"""
    
    package = {
        "name": "@payease/web",
        "version": "0.1.0",
        "private": True,
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "preview": "vite preview",
            "test": "vitest"
        },
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.21.0",
            "@tanstack/react-query": "^5.13.0",
            "axios": "^1.6.2",
            "zustand": "^4.4.7"
        },
        "devDependencies": {
            "@types/react": "^18.2.43",
            "@types/react-dom": "^18.2.17",
            "@vitejs/plugin-react": "^4.2.1",
            "vite": "^5.0.8",
            "tailwindcss": "^3.3.6",
            "autoprefixer": "^10.4.16",
            "postcss": "^8.4.32",
            "vitest": "^1.1.0"
        }
    }
    
    with open(root / 'apps/web/package.json', 'w') as f:
        json.dump(package, f, indent=2)
    
    print("✅ Created apps/web/package.json")

def create_tsconfig(root: Path):
    """Create TypeScript configuration"""
    
    tsconfig = {
        "compilerOptions": {
            "target": "ES2022",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "strict": True,
            "esModuleInterop": True,
            "skipLibCheck": True,
            "forceConsistentCasingInFileNames": True,
            "resolveJsonModule": True,
            "declaration": True,
            "declarationMap": True,
            "sourceMap": True
        },
        "exclude": ["node_modules", "dist"]
    }
    
    with open(root / 'tsconfig.json', 'w') as f:
        json.dump(tsconfig, f, indent=2)
    
    print("✅ Created tsconfig.json")

def create_readme(root: Path):
    """Create README.md"""
    
    content = """# PayEase

Simple payroll management for small businesses.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

## Project Structure

```
├── apps/
│   ├── api/          # Express.js backend
│   └── web/          # React/Vite frontend
├── packages/
│   └── shared/       # Shared types and utilities
├── directives/       # Agent SOPs
├── execution/        # Deterministic scripts
└── skills/           # Reusable skill modules
```

## Development

- API: http://localhost:4000
- Web: http://localhost:3000

## Documentation

See `/directives` for development workflows.
"""
    
    with open(root / 'README.md', 'w') as f:
        f.write(content)
    
    print("✅ Created README.md")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Scaffold PayEase project')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    args = parser.parse_args()
    
    root = Path(args.project_root).resolve()
    
    print(f"\n=== Scaffolding PayEase at {root} ===\n")
    
    create_directory_structure(root)
    create_root_package_json(root)
    create_api_package_json(root)
    create_web_package_json(root)
    create_tsconfig(root)
    create_readme(root)
    
    print(f"\n✅ Scaffolding complete!")
    print("\nNext steps:")
    print("  1. npm install")
    print("  2. cp .env.example .env")
    print("  3. npm run dev")

if __name__ == '__main__':
    main()
