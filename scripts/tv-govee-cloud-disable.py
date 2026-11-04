#!/usr/bin/env python3
"""Disable only this Govee cloud watcher; preserve credentials and light settings."""
import os,pathlib,signal
root=pathlib.Path('/proc')
hook=pathlib.Path('/var/lib/webosbrew/init.d/93-launcher-tr-govee-cloud')
if hook.exists():hook.unlink()
for p in root.iterdir():
    if not p.name.isdigit():continue
    try:args=(p/'cmdline').read_bytes().split(b'\0')
    except OSError:continue
    if b'/var/lib/webos-launcher-tr/govee-cloud/power.py' not in args:continue
    pid=int(p.name)
    for child in root.iterdir():
        if not child.name.isdigit():continue
        try:
            parent=next(s for s in (child/'status').read_text().splitlines() if s.startswith('PPid:')).split()[1]
            cmd=(child/'cmdline').read_bytes().split(b'\0')
            if parent==str(pid) and b'luna://com.webos.service.tvpower/power/getPowerState' in cmd:os.kill(int(child.name),signal.SIGTERM)
        except (OSError,StopIteration):pass
    try:os.kill(pid,signal.SIGTERM)
    except ProcessLookupError:pass
print('Govee automation disabled; current light settings preserved.')
