#!/usr/bin/env python3
"""
setup_env.py - Environment setup script for PayEase

This script ensures consistent development environment setup across all team members.
It validates dependencies, creates necessary directories, and generates config files.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Color output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def log_success(msg):
    print(f"{GREEN}✓{RESET} {msg}")

def log_error(msg):
    print(f"{RED}✗{RESET} {msg}")

def log_warning(msg):
    print(f"{YELLOW}!{RESET} {msg}")

def check_node():
    """Check Node.js version >= 18"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip().replace('v', '')
        major = int(version.split('.')[0])
        if major >= 18:
            log_success(f"Node.js {version}")
            return True
        else:
            log_error(f"Node.js {version} (requires >= 18)")
            return False
    except FileNotFoundError:
        log_error("Node.js not found")
        return False

def check_npm():
    """Check npm is available"""
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        log_success(f"npm {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        log_error("npm not found")
        return False

def check_postgres():
    """Check PostgreSQL is available"""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        log_success(f"PostgreSQL {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        log_warning("PostgreSQL CLI not found (may still work if using Docker)")
        return True  # Allow to continue

def create_directories():
    """Create required project directories"""
    dirs = [
        'src/api',
        'src/services',
        'src/models',
        'src/utils',
        'src/components',
        'src/pages',
        'tests/unit',
        'tests/integration',
        'logs',
        '.tmp'
    ]
    
    project_root = Path(__file__).parent.parent
    
    for d in dirs:
        dir_path = project_root / d
        dir_path.mkdir(parents=True, exist_ok=True)
    
    log_success(f"Created {len(dirs)} directories")

def create_env_example():
    """Create .env.example file"""
    project_root = Path(__file__).parent.parent
    env_example = project_root / '.env.example'
    
    content = """# PayEase Environment Variables

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payease
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@payease.in

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET=payease-files

# Error Tracking
SENTRY_DSN=

# App
NODE_ENV=development
PORT=3000
API_PORT=4000
"""
    
    env_example.write_text(content)
    log_success("Created .env.example")

def install_dependencies():
    """Install npm dependencies"""
    project_root = Path(__file__).parent.parent
    
    if not (project_root / 'package.json').exists():
        log_warning("No package.json found - skipping npm install")
        return True
    
    try:
        subprocess.run(['npm', 'install'], cwd=project_root, check=True)
        log_success("Installed npm dependencies")
        return True
    except subprocess.CalledProcessError:
        log_error("Failed to install npm dependencies")
        return False

def main():
    print("\n=== PayEase Environment Setup ===\n")
    
    print("Checking dependencies...")
    checks = [
        check_node(),
        check_npm(),
        check_postgres(),
    ]
    
    if not all(checks):
        print(f"\n{RED}Some dependencies are missing. Please install them and retry.{RESET}")
        sys.exit(1)
    
    print("\nSetting up project structure...")
    create_directories()
    create_env_example()
    
    print(f"\n{GREEN}Environment setup complete!{RESET}")
    print("\nNext steps:")
    print("  1. Copy .env.example to .env and fill in your values")
    print("  2. Run: npm install")
    print("  3. Run: npm run dev")

if __name__ == '__main__':
    main()
