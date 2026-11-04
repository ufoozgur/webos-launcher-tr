#!/usr/bin/env python3
"""Govee power follows TV power events. Credentials stay in a root-only TV file."""
import fcntl,json,pathlib,subprocess,sys,threading,time,urllib.request,uuid
STATE=pathlib.Path('/var/lib/webos-launcher-tr/govee-cloud')
config=json.loads((STATE/'config.json').read_text())
if config.get('sku')!='H6099':raise SystemExit('Expected verified H6099 configuration')

def api(method,capability=None):
    payload={'sku':config['sku'],'device':config['device']}
    if capability is not None:payload['capability']=capability
    request=urllib.request.Request('https://openapi.api.govee.com/router/api/v1/device/'+method,
        data=json.dumps({'requestId':str(uuid.uuid4()),'payload':payload}).encode(),
        headers={'Govee-API-Key':config['apiKey'],'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=4) as response:data=json.load(response)
    if data.get('code')!=200:raise RuntimeError('Govee response code '+str(data.get('code')))
    return data

def turn(on):
    result=api('control',{'type':'devices.capabilities.on_off','instance':'powerSwitch','value':int(on)})
    if on:api('control',{'type':'devices.capabilities.range','instance':'brightness','value':100})
    return result

def status():
    data=api('state').get('payload',{})
    values={item.get('instance'):item.get('state',{}).get('value') for item in data.get('capabilities',[])}
    print(json.dumps({k:values[k] for k in ['online','powerSwitch','brightness'] if k in values}),flush=True)

if len(sys.argv)>1:
    if sys.argv[1]=='status':status()
    elif sys.argv[1] in ['on','off']:
        turn(sys.argv[1]=='on');print('Govee command accepted: '+sys.argv[1],flush=True)
    else:raise SystemExit('Use status, on, off, or no argument for event watcher')
    raise SystemExit(0)

lock=open('/tmp/launcher-tr-govee-cloud.lock','w')
try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError:raise SystemExit(0)
condition=threading.Condition()
desired=None
generation=0

def worker():
    handled=0
    while True:
        with condition:
            condition.wait_for(lambda:generation!=handled)
            revision=generation;on=desired
        deadline=time.time()+25
        for attempt in range(4 if on else 2):
            with condition:
                if revision!=generation or time.time()>deadline:break
            try:
                turn(on)
                print(time.strftime('%Y-%m-%dT%H:%M:%S')+' H6099 accepted '+('on' if on else 'off'),flush=True)
                break
            except Exception as error:
                # Never log request headers, credentials, or raw server responses.
                print('H6099 request failed: '+type(error).__name__,flush=True)
                with condition:
                    if revision!=generation:break
                    condition.wait(timeout=2*(attempt+1))
        handled=revision

threading.Thread(target=worker,daemon=True).start()
while True:
    process=None
    try:
        process=subprocess.Popen(['luna-send','-i','luna://com.webos.service.tvpower/power/getPowerState','{"subscribe":true}'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,universal_newlines=True,bufsize=1)
        for line in process.stdout:
            try:data=json.loads(line)
            except ValueError:continue
            state=str(data.get('state',''))
            if state=='Active':on=True
            elif any(word in state.lower() for word in ['standby','suspend','poweroff','shutdown']):on=False
            else:continue
            with condition:
                if on!=desired:
                    print('TV power: '+state,flush=True)
                    desired=on;generation+=1;condition.notify_all()
    except OSError as error:print('TV subscription failed: '+type(error).__name__,flush=True)
    finally:
        if process and process.poll() is None:process.terminate()
    time.sleep(5)
