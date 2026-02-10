#!/usr/bin/env python3
"""
Setup Agent Environment

This script scaffolds the 3-layer agent architecture by:
1. Creating necessary directories (directives, execution, .tmp)
2. specific agent instruction files (CLAUDE.md, GEMINI.md) from the source AGENTS.md
3. Creating default configuration files (.env, .gitignore)
"""

import os
import shutil
import sys
from pathlib import Path

def main():
    # Base path is the current working directory
    base_path = Path.cwd()
    
    # 1. Create directory structure
    dirs = ['directives', 'execution', '.tmp']
    for d in dirs:
        dir_path = base_path / d
        if not dir_path.exists():
            dir_path.mkdir(exist_ok=True)
            print(f"✅ Created directory: {d}/")
        else:
            print(f"ℹ️  Directory already exists: {d}/")
            
    # 2. Mirror AGENTS.md
    # We expect AGENTS.md to be available. In a real skill usage, 
    # we might want to copy it from the skill's assets if it doesn't exist in CWD.
    # For this script, we'll assume we are setting up FROM the assets.
    
    # Locate the AGENTS.md asset within the skill directory structure
    # This script is in skills/agent-setup/scripts/setup_agent.py
    # Assets should be in skills/agent-setup/assets/AGENTS.md
    # However, when the skill is installed/used, the script might be run from anywhere.
    # We need a robust way to find the asset. 
    # But often skills scripts are standalone. 
    # Let's assume the user of the skill might provide the AGENTS.md or we copy it from the skill location.
    
    script_path = Path(__file__).resolve()
    skill_root = script_path.parent.parent
    agents_asset = skill_root / 'assets' / 'AGENTS.md'
    
    target_agents_file = base_path / 'AGENTS.md'
    
    if agents_asset.exists():
        if not target_agents_file.exists():
            shutil.copy(agents_asset, target_agents_file)
            print("✅ Created AGENTS.md from skill assets")
        else:
            print("ℹ️  AGENTS.md already exists in project root")
    else:
        print("⚠️  Warning: AGENTS.md not found in skill assets")
        
    # Now mirror to CLAUDE.md and GEMINI.md
    if target_agents_file.exists():
        targets = ['CLAUDE.md', 'GEMINI.md']
        for t in targets:
            dest = base_path / t
            if not dest.exists():
                shutil.copy(target_agents_file, dest)
                print(f"✅ Created {t}")
            else:
                print(f"ℹ️  {t} already exists")
    
    # 3. Create configuration files
    env_file = base_path / '.env'
    if not env_file.exists():
        env_file.touch()
        print("✅ Created .env (empty)")
    else:
        print("ℹ️  .env already exists")
        
    gitignore_file = base_path / '.gitignore'
    gitignore_content = """.tmp/
.env
credentials.json
token.json
__pycache__/
*.pyc
"""
    if not gitignore_file.exists():
        gitignore_file.write_text(gitignore_content)
        print("✅ Created .gitignore")
    else:
        # Check if we should append or warn
        print("ℹ️  .gitignore already exists, creating .gitignore.new instead")
        (base_path / '.gitignore.new').write_text(gitignore_content)

if __name__ == "__main__":
    main()
