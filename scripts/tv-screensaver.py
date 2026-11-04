#!/usr/bin/env python3
"""Reversible QML saver overlay for rooted webOS with native saver lifecycle."""
import json,os,pathlib,subprocess,sys
import shutil

STATE=pathlib.Path('/var/lib/webos-launcher-tr')
SAVER=STATE/'screensaver'
TARGET=pathlib.Path('/usr/palm/applications/com.webos.app.screensaver/appinfo.json')
APPDIR=TARGET.parent
OVERRIDE=SAVER/'appinfo.json'
HOOK=pathlib.Path('/var/lib/webosbrew/init.d/91-webos-launcher-tr-saver')
APP='com.webos.app.screensaver'

def call(method,params):
    r=subprocess.run(['luna-send','-n','1','-w','5000','luna://com.webos.applicationManager/'+method,json.dumps(params)],capture_output=True,text=True)
    data=json.loads(r.stdout)
    if data.get('returnValue') is False:raise RuntimeError(data.get('errorText',method))
    return data

def mounted(target=APPDIR):
    return any(line.split()[1]==str(target) for line in pathlib.Path('/proc/mounts').read_text().splitlines())

def reread():
    try:call('blockSystemApp',{'id':APP,'forceBlockSystemApp':False})
    finally:call('releaseBlockSystemApp',{'id':APP})

def apply():
    if mounted(TARGET):subprocess.run(['umount',str(TARGET)],check=True)
    if not mounted():subprocess.run(['mount','--bind',str(SAVER),str(APPDIR)],check=True)
    try:
        reread()
        assert call('getAppInfo',{'id':APP})['appInfo']['type']=='qml'
    except Exception:
        if mounted():subprocess.run(['umount',str(APPDIR)],check=True)
        reread()
        raise

def main():
    if os.getuid()!=0:raise RuntimeError('Root gerekli')
    action=sys.argv[1] if len(sys.argv)>1 else 'status'
    if action=='enable':
        native=STATE/'flutter-text/native-quotes.py'
        if pathlib.Path('/var/lib/webosbrew/init.d/92-webos-launcher-tr-native-quotes').exists() and native.exists():
            subprocess.run(['/usr/bin/python3',str(native),'disable'],check=True)
        for filename in ['Quotes.qml','Quotes.js','fonts/Orbitron.ttf','fonts/Cinzel.ttf','fonts/BebasNeue.ttf','fonts/PlayfairDisplay.ttf','fonts/ShareTechMono.ttf','fonts/ComicNeue.ttf']:
            if not (SAVER/filename).is_file():raise RuntimeError('Eksik dosya: '+filename)
        backup=STATE/'screensaver.original.json'
        if not backup.exists():backup.write_bytes(TARGET.read_bytes())
        manifest=json.loads(backup.read_text())
        qml=SAVER/'qml'
        qml.mkdir(exist_ok=True)
        shutil.copyfile(SAVER/'Quotes.qml',qml/'main.qml')
        shutil.copyfile(SAVER/'Quotes.js',qml/'Quotes.js')
        if not (qml/'fonts').exists():(qml/'fonts').symlink_to('../fonts',target_is_directory=True)
        manifest.update(type='qml',main='qml/main.qml',title='Replikli Ekran Koruyucu',resolution='1920x1080')
        OVERRIDE.write_text(json.dumps(manifest,indent=2)+'\n')
        stored=STATE/'screensaver.py'
        if pathlib.Path(__file__).resolve()!=stored:stored.write_text(pathlib.Path(__file__).read_text())
        apply()
        HOOK.write_text('#!/bin/sh\n/usr/bin/python3 /var/lib/webos-launcher-tr/screensaver.py apply >>/tmp/webos-launcher-tr-saver.log 2>&1\n')
        HOOK.chmod(0o755)
        print('Quote screensaver enabled; original manifest preserved')
    elif action=='apply':apply()
    elif action=='disable':
        if HOOK.exists():HOOK.unlink()
        if mounted():subprocess.run(['umount',str(APPDIR)],check=True)
        if mounted(TARGET):subprocess.run(['umount',str(TARGET)],check=True)
        reread()
        print('Original LG screensaver restored')
    else:print(json.dumps(call('getAppInfo',{'id':APP})))

if __name__=='__main__':main()
