#!/usr/bin/env python3
"""
Dependency and third-party script audit for the ANTIGRAVITY platform.

Scans the repository for:
- All npm dependencies (package.json)
- All Python dependencies (requirements.txt)
- CDN scripts in HTML/TSX/JS files
- Third-party service keys in .env files
- Analytics/tracking IDs in config files

Outputs a structured JSON report.

Usage: python scripts/audit-dependencies.py [--output report.json]
"""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime


def find_files(root, filename, max_depth=6):
    """Find all files with a given name."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in (
            'node_modules', '.venv', '.git', 'dist', 'build', '.next', '.cache'
        )]
        depth = dirpath.replace(root, '').count(os.sep)
        if depth > max_depth:
            dirnames.clear()
            continue
        if filename in filenames:
            results.append(os.path.join(dirpath, filename))
    return results


def scan_package_json(filepath, root):
    """Extract dependencies from a package.json file."""
    rel = filepath.replace(root + '/', '')
    try:
        with open(filepath) as f:
            pkg = json.load(f)
        deps = []
        for name, version in {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}.items():
            deps.append({
                'name': name,
                'version': version,
                'type': 'npm',
                'source': rel,
            })
        return deps
    except (json.JSONDecodeError, IOError):
        return []


def scan_requirements_txt(filepath, root):
    """Extract dependencies from a requirements.txt file."""
    rel = filepath.replace(root + '/', '')
    deps = []
    try:
        with open(filepath) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Parse package==version or package>=version
                    match = re.match(r'^([a-zA-Z0-9_-]+)\s*([><=!~]+.*)?$', line)
                    if match:
                        deps.append({
                            'name': match.group(1),
                            'version': match.group(2) or 'unspecified',
                            'type': 'pypi',
                            'source': rel,
                        })
    except IOError:
        pass
    return deps


def scan_cdn_scripts(root):
    """Find CDN and insecure scripts in HTML/TSX/JS files."""
    results = []
    pattern = re.compile(r'<script[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in (
            'node_modules', '.venv', '.git', 'dist', 'build', '.next', '.cache'
        )]
        depth = dirpath.replace(root, '').count(os.sep)
        if depth > 6:
            dirnames.clear()
            continue
        for f in filenames:
            if f.endswith(('.html', '.tsx', '.jsx', '.vue', '.svelte', '.htm')):
                filepath = os.path.join(dirpath, f)
                try:
                    with open(filepath, 'r', errors='ignore') as fh:
                        content = fh.read()
                    for match in pattern.finditer(content):
                        url = match.group(1)
                        risk = 'low'
                        if url.startswith('http://'):
                            risk = 'high'
                        elif any(cdn in url.lower() for cdn in ['unpkg', 'jsdelivr', 'cdnjs', 'cdn.tailwind']):
                            risk = 'medium'
                        elif 'cdn' in url.lower():
                            risk = 'low'
                        else:
                            continue
                        # Check for SRI
                        tag_start = max(0, match.start() - 200)
                        tag_end = min(len(content), match.end() + 200)
                        tag_context = content[tag_start:tag_end]
                        has_sri = 'integrity=' in tag_context
                        results.append({
                            'file': filepath.replace(root + '/', ''),
                            'url': url,
                            'risk': risk,
                            'has_sri': has_sri,
                        })
                except IOError:
                    pass
    return results


def scan_env_files(root):
    """Find third-party service keys in .env files."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in (
            'node_modules', '.venv', '.git', 'dist', 'build'
        )]
        depth = dirpath.replace(root, '').count(os.sep)
        if depth > 4:
            dirnames.clear()
            continue
        for f in filenames:
            if f.startswith('.env'):
                filepath = os.path.join(dirpath, f)
                try:
                    with open(filepath, 'r', errors='ignore') as fh:
                        for line in fh:
                            line = line.strip()
                            if '=' in line and not line.startswith('#'):
                                key = line.split('=')[0].strip()
                                if any(svc in key.upper() for svc in [
                                    'API_KEY', 'SECRET', 'TOKEN', 'STRIPE', 'SENDGRID',
                                    'TWILIO', 'AWS', 'GOOGLE', 'GITHUB', 'SENTRY',
                                    'ANALYTICS', 'TRACKING', 'PAGERDUTY', 'DISCORD'
                                ]):
                                    results.append({
                                        'file': filepath.replace(root + '/', ''),
                                        'key': key,
                                    })
                except IOError:
                    pass
    return results


def main():
    root = os.environ.get('ANTIGRAVITY_ROOT', '/mnt/c/ANTIGRAVITY')
    output_file = None
    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            output_file = sys.argv[idx + 1]

    print(f"Scanning {root}...")

    # Collect all data
    npm_deps = []
    for pf in find_files(root, 'package.json'):
        npm_deps.extend(scan_package_json(pf, root))

    pypi_deps = []
    for rf in find_files(root, 'requirements.txt'):
        pypi_deps.extend(scan_requirements_txt(rf, root))

    cdn_scripts = scan_cdn_scripts(root)
    env_keys = scan_env_files(root)

    # Build report
    report = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'repository': root,
        'summary': {
            'npm_dependencies': len(npm_deps),
            'pypi_dependencies': len(pypi_deps),
            'cdn_scripts': len(cdn_scripts),
            'cdn_without_sri': sum(1 for s in cdn_scripts if not s['has_sri']),
            'third_party_service_keys': len(env_keys),
            'high_risk_items': sum(1 for s in cdn_scripts if s['risk'] == 'high'),
        },
        'npm_dependencies': npm_deps,
        'pypi_dependencies': pypi_deps,
        'cdn_scripts': cdn_scripts,
        'third_party_service_keys': env_keys,
        'recommendations': [],
    }

    # Generate recommendations
    insecure = [s for s in cdn_scripts if s['risk'] == 'high']
    if insecure:
        report['recommendations'].append({
            'severity': 'high',
            'title': 'Insecure HTTP CDN scripts',
            'description': f'{len(insecure)} script(s) loaded over HTTP instead of HTTPS',
            'files': [s['file'] for s in insecure],
        })

    no_sri = [s for s in cdn_scripts if not s['has_sri'] and s['risk'] in ('medium', 'high')]
    if no_sri:
        report['recommendations'].append({
            'severity': 'medium',
            'title': 'CDN scripts without Subresource Integrity',
            'description': f'{len(no_sri)} CDN script(s) missing SRI hashes',
            'files': list(set(s['file'] for s in no_sri)),
        })

    # Output
    report_json = json.dumps(report, indent=2)
    if output_file:
        with open(output_file, 'w') as f:
            f.write(report_json)
        print(f"Report written to {output_file}")
    else:
        print(report_json)

    # Print summary
    print(f"\n=== Audit Summary ===")
    print(f"  npm dependencies: {len(npm_deps)}")
    print(f"  PyPI dependencies: {len(pypi_deps)}")
    print(f"  CDN scripts: {len(cdn_scripts)} ({sum(1 for s in cdn_scripts if not s['has_sri'])} without SRI)")
    print(f"  Third-party service keys: {len(env_keys)}")
    print(f"  High-risk items: {report['summary']['high_risk_items']}")
    print(f"  Recommendations: {len(report['recommendations'])}")


if __name__ == '__main__':
    main()
