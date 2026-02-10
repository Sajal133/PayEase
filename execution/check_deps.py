#!/usr/bin/env python3
"""
check_deps.py - Dependency verification script for PayEase

Validates that all required dependencies and services are available
before running the application.
"""

import subprocess
import sys
import socket
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

def check_port(port, service_name):
    """Check if a service is running on given port"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    
    if result == 0:
        log_success(f"{service_name} running on port {port}")
        return True
    else:
        log_error(f"{service_name} not running on port {port}")
        return False

def check_node_modules():
    """Check if node_modules exists"""
    project_root = Path(__file__).parent.parent
    node_modules = project_root / 'node_modules'
    
    if node_modules.exists():
        log_success("node_modules installed")
        return True
    else:
        log_error("node_modules not found - run 'npm install'")
        return False

def check_env_file():
    """Check if .env file exists"""
    project_root = Path(__file__).parent.parent
    env_file = project_root / '.env'
    
    if env_file.exists():
        log_success(".env file exists")
        return True
    else:
        log_error(".env file not found - copy from .env.example")
        return False

def check_required_env_vars():
    """Check required environment variables"""
    import os
    from dotenv import load_dotenv
    
    project_root = Path(__file__).parent.parent
    load_dotenv(project_root / '.env')
    
    required = ['DATABASE_URL', 'JWT_SECRET']
    missing = [v for v in required if not os.getenv(v)]
    
    if missing:
        for v in missing:
            log_error(f"Missing env var: {v}")
        return False
    else:
        log_success("Required environment variables set")
        return True

def main():
    print("\n=== PayEase Dependency Check ===\n")
    
    all_passed = True
    
    print("Checking project setup...")
    all_passed &= check_node_modules()
    all_passed &= check_env_file()
    
    print("\nChecking services...")
    all_passed &= check_port(5432, "PostgreSQL")
    all_passed &= check_port(6379, "Redis")
    
    if all_passed:
        print(f"\n{GREEN}All checks passed! Ready to start development.{RESET}")
        sys.exit(0)
    else:
        print(f"\n{RED}Some checks failed. Please fix the issues above.{RESET}")
        sys.exit(1)

if __name__ == '__main__':
    main()
