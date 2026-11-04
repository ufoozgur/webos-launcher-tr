#!/usr/bin/env python3
"""Install the optional H6099 event watcher after a private config is supplied."""
import json,os,pathlib,subprocess
if os.getuid()!=0:raise SystemExit('Root required')
state=pathlib.Path('/var/lib/webos-launcher-tr/govee-cloud')
config=state/'config.json'
data=json.loads(config.read_text())
if data.get('sku')!='H6099' or not data.get('device') or not data.get('apiKey'):raise SystemExit('Private H6099 config required')
state.chmod(0o700);config.chmod(0o600)
source=pathlib.Path(__file__).with_name('tv-govee-cloud.py')
subprocess.run(['python3',str(source),'status'],check=True)
target=state/'power.py';target.write_bytes(source.read_bytes());target.chmod(0o700)
hook=pathlib.Path('/var/lib/webosbrew/init.d/93-launcher-tr-govee-cloud')
hook.write_text('#!/bin/sh\nnohup python3 -u /var/lib/webos-launcher-tr/govee-cloud/power.py >/tmp/launcher-tr-govee-cloud.log 2>&1 </dev/null &\n');hook.chmod(0o755)
subprocess.run(['sh',str(hook)],check=True)
print('Govee H6099 TV power watcher installed')
