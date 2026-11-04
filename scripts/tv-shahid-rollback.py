#!/usr/bin/env python3
"""Undo only our Shahid mapping, preserving unrelated inputhook bindings."""
import json,pathlib
state=pathlib.Path('/var/lib/webos-launcher-tr/inputhook')
backup=json.loads((state/'before.json').read_text())
previous=json.loads(backup['content']) if backup['exists'] else {}
target=pathlib.Path('/home/root/.config/lginputhook/keybinds.json')
current=json.loads(target.read_text())
if '1092' in previous:current['1092']=previous['1092']
else:current.pop('1092',None)
target.write_text(json.dumps(current)+'\n')
hook=pathlib.Path('/var/lib/webosbrew/init.d/94-launcher-tr-shahid')
if hook.exists():hook.unlink()
print('Shahid restored. Hook library unloads at next TV reboot; other mappings preserved.')
