#!/usr/bin/env python3
"""Rotate native Flutter saver translations between sessions; never patch its code."""
import fcntl
import json
import os
import pathlib
import signal
import subprocess
import sys
import time

STATE = pathlib.Path('/var/lib/webos-launcher-tr/flutter-text')
SOURCE = pathlib.Path('/usr/palm/applications/com.webos.app.screensaver/data/flutter_assets/assets/i18n/tr.json')
HOOK = pathlib.Path('/var/lib/webosbrew/init.d/92-webos-launcher-tr-native-quotes')
APP = 'com.webos.app.screensaver'
KEYS = ['Press any button to back on the screen.', 'To turn the screen back on, please press any button except for the power button.']


def call(uri, params):
    result = subprocess.run(['luna-send', '-n', '1', '-w', '5000', 'luna://' + uri, json.dumps(params)], capture_output=True, text=True, timeout=7)
    result.check_returncode()
    data = json.loads(result.stdout)
    if data.get('returnValue') is False:
        if uri.endswith('/closeByAppId') and data.get('errorText') == 'native app is not running':
            return data
        raise RuntimeError(data)
    return data


def mounted(target):
    return any(line.split()[1] == str(target) for line in pathlib.Path('/proc/mounts').read_text().splitlines())


def prepare(advance=False):
    # Only call after leaving ScreenSaver: Flutter reads this dictionary at startup.
    if call('com.webos.service.tvpower/power/getPowerState', {}).get('state') != 'Active':
        return
    quotes = json.loads((STATE / 'quotes.json').read_text())
    position = STATE / 'position.json'
    index = json.loads(position.read_text())['index'] if position.exists() else 0
    if advance:
        index = (index + 1) % len(quotes)
    quote = quotes[index]
    # Stock Flutter flattens LF; U+2028 survives. Its guide only shows two lines.
    text = '“' + quote['text'] + '” - ' + quote['character'] + ' (' + quote['actor'] + ')\u2028' + quote['film'] + ' (' + str(quote['year']) + ')'
    data = json.loads((STATE / 'tr.original.json').read_text())
    for key in KEYS:
        data[key] = text
    # In-place write preserves the inode used by the bind mount.
    (STATE / 'tr.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    target = pathlib.Path((STATE / 'target-path.txt').read_text().strip())
    if not mounted(target):
        subprocess.run(['mount', '--bind', str(STATE / 'tr.json'), str(target)], check=True)
    # Recheck before closing; never close an active saver.
    if call('com.webos.service.tvpower/power/getPowerState', {}).get('state') == 'Active':
        call('com.webos.applicationManager/closeByAppId', {'id': APP})
    position.write_text(json.dumps({'index': index}) + '\n')
    print('Prepared quote %d/%d: %s' % (index + 1, len(quotes), quote['film']), flush=True)


def listen():
    def terminate(signum, frame):
        raise SystemExit(0)
    signal.signal(signal.SIGTERM, terminate)
    lock = open(STATE / 'listener.lock', 'w')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return
    (STATE / 'listener.pid').write_text(str(os.getpid()))
    prepare()
    while True:
        proc = subprocess.Popen(['luna-send', '-i', 'luna://com.webos.service.tvpower/power/getPowerState', '{"subscribe":true}'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, universal_newlines=True)
        try:
            decoder = json.JSONDecoder()
            buffer = ''
            was_saver = False
            # luna-send pretty-prints some responses; parse complete JSON objects.
            for line in proc.stdout:
                buffer += line
                try:
                    event, end = decoder.raw_decode(buffer.lstrip())
                except ValueError:
                    if len(buffer) > 65536:
                        raise RuntimeError('Invalid power subscription response')
                    continue
                buffer = buffer.lstrip()[end:].lstrip()
                if event.get('returnValue') is False:
                    raise RuntimeError(event)
                state = event.get('state')
                if state in ('ScreenSaver', 'Screen Saver'):
                    was_saver = True
                elif state == 'Active' and was_saver:
                    was_saver = False
                    time.sleep(0.8)
                    prepare(advance=True)
        finally:
            proc.terminate()
            proc.wait()
        time.sleep(10)  # Reconnect only if the subscription exits.


def stop():
    pidfile = STATE / 'listener.pid'
    if pidfile.exists():
        pid = int(pidfile.read_text())
        cmd = pathlib.Path('/proc/%d/cmdline' % pid)
        if cmd.exists() and b'native-quotes.py' in cmd.read_bytes():
            os.kill(pid, signal.SIGTERM)
            for _ in range(30):
                if not cmd.exists() or not cmd.read_bytes():
                    break
                time.sleep(0.1)
            else:
                raise RuntimeError('Listener did not stop; leaving configuration intact')
        pidfile.unlink()


def main():
    if os.getuid() != 0:
        raise RuntimeError('Root gerekli')
    action = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if action == 'enable':
        if pathlib.Path('/var/lib/webosbrew/init.d/91-webos-launcher-tr-saver').exists():
            raise RuntimeError('Önce özel QML ekran koruyucusunu kapatın')
        STATE.mkdir(parents=True, exist_ok=True)
        target = SOURCE.resolve()
        backup = STATE / 'tr.original.json'
        if not backup.exists():
            backup.write_bytes(target.read_bytes())
        (STATE / 'target-path.txt').write_text(str(target))
        quotes = json.loads(pathlib.Path(sys.argv[2]).read_text())
        if not quotes or any(not all(q.get(k) for k in ['text', 'character', 'actor', 'film', 'year']) for q in quotes):
            raise RuntimeError('Geçersiz replik listesi')
        (STATE / 'quotes.json').write_text(json.dumps(quotes, ensure_ascii=False, indent=2) + '\n')
        stored = STATE / 'native-quotes.py'
        if pathlib.Path(__file__).resolve() != stored:
            stored.write_text(pathlib.Path(__file__).read_text())
        stop()
        HOOK.write_text('#!/bin/sh\n/usr/bin/python3 /var/lib/webos-launcher-tr/flutter-text/native-quotes.py listen >>/tmp/webos-launcher-tr-native-quotes.log 2>&1 </dev/null &\n')
        HOOK.chmod(0o755)
        subprocess.Popen(['/bin/sh', str(HOOK)], start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print('Native quote rotation enabled')
    elif action == 'listen':
        listen()
    elif action == 'disable':
        stop()
        if HOOK.exists():
            HOOK.unlink()
        targetfile = STATE / 'target-path.txt'
        if targetfile.exists():
            target = pathlib.Path(targetfile.read_text().strip())
            if mounted(target):
                subprocess.run(['umount', str(target)], check=True)
        if call('com.webos.service.tvpower/power/getPowerState', {}).get('state') == 'Active':
            call('com.webos.applicationManager/closeByAppId', {'id': APP})
        print('Original native translation restored; backup retained')
    elif action == 'status':
        print(json.dumps({'enabled': HOOK.exists(), 'position': json.loads((STATE / 'position.json').read_text()) if (STATE / 'position.json').exists() else None}))
    else:
        raise RuntimeError('Unknown action')


if __name__ == '__main__':
    main()
