#!/usr/bin/env python3
"""Select this launcher through webOS's native home profile; no resident helper."""
import json,os,pathlib,subprocess,sys

APP='works.partridge.webos-launcher'
STATE=pathlib.Path('/var/lib/webos-launcher-tr')
OVERRIDE=pathlib.Path('/var/webos-profile/override/org.webosbrew.launcher-tr.json')
HOOK=pathlib.Path('/var/lib/webosbrew/init.d/90-webos-launcher-tr')

def call(uri,params):
    r=subprocess.run(['luna-send','-n','1','-w','5000',uri,json.dumps(params)],capture_output=True,text=True)
    data=json.loads(r.stdout)
    if data.get('returnValue') is False: raise RuntimeError(data.get('errorText',uri))
    return data

def profiles():
    return call('luna://com.webos.service.systemprofile/getProfiles',{'names':['defaultApps','idleApp']})['profiles']

def apply():
    p=profiles()
    default={k:v for k,v in p['defaultApps'].items() if not k.startswith('_')}
    default['categories']=dict(default.get('categories',{}),home=APP)
    idle={k:v for k,v in p.get('idleApp',{}).items() if not k.startswith('_')}
    idle.update(support=True,appId=APP)
    OVERRIDE.parent.mkdir(parents=True,exist_ok=True)
    OVERRIDE.write_text(json.dumps({'defaultApps':default,'idleApp':idle},indent=2)+'\n')
    call('luna://com.webos.applicationManager/setDefaultApp',{'category':'home','appId':APP})
    call('luna://com.webos.service.systemprofile/debug/rescan',{})
    assert profiles()['defaultApps']['categories']['home']==APP

def main():
    if os.getuid()!=0:raise RuntimeError('Root gerekli')
    action=sys.argv[1] if len(sys.argv)>1 else 'status'
    if action=='enable':
        STATE.mkdir(parents=True,exist_ok=True)
        backup=STATE/'home-before.json'
        if not backup.exists():
            settings=call('luna://com.webos.settingsservice/getSystemSettings',{'category':'general','keys':['defaultApps']})['settings']['defaultApps']
            backup.write_text(json.dumps({'record':settings,'override':OVERRIDE.read_text() if OVERRIDE.exists() else None}))
        stored=STATE/'home.py'
        if pathlib.Path(__file__).resolve()!=stored:stored.write_text(pathlib.Path(__file__).read_text())
        apply()
        HOOK.write_text('#!/bin/sh\n/usr/bin/python3 /var/lib/webos-launcher-tr/home.py reapply >>/tmp/webos-launcher-tr-boot.log 2>&1\n')
        HOOK.chmod(0o755)
        call('luna://com.webos.applicationManager/launch',{'id':APP})
        print('Native home profile enabled')
    elif action=='reapply':
        apply()
        state=call('luna://com.webos.service.tvpower/power/getPowerState',{}).get('state')
        if state=='Active':call('luna://com.webos.applicationManager/launch',{'id':APP})
    elif action=='disable':
        backup=json.loads((STATE/'home-before.json').read_text())
        call('luna://com.webos.settingsservice/setSystemSettings',{'category':'general','settings':{'defaultApps':dict(backup['record'],home=backup['record'].get('home'))}})
        if backup['override'] is None:
            if OVERRIDE.exists():OVERRIDE.unlink()
        else:OVERRIDE.write_text(backup['override'])
        if HOOK.exists():HOOK.unlink()
        call('luna://com.webos.service.systemprofile/debug/rescan',{})
        call('luna://com.webos.applicationManager/launch',{'id':'com.webos.app.home'})
        print('LG Home restored')
    else:print(json.dumps(profiles()))

if __name__=='__main__':main()
