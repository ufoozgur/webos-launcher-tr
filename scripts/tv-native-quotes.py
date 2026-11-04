#!/usr/bin/env python3
"""Rotate native Flutter saver translations between sessions; never patch its code."""
import fcntl
import hashlib
import json
import os
import pathlib
import random
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
    for attempt in range(3):
        try:
            result = subprocess.run(['luna-send', '-n', '1', '-w', '5000', 'luna://' + uri, json.dumps(params)], capture_output=True, text=True, timeout=7)
            result.check_returncode()
            data = json.loads(result.stdout)
            break
        except (ValueError, subprocess.SubprocessError):
            if attempt == 2:
                raise
            time.sleep(0.4)
    if data.get('returnValue') is False:
        if uri.endswith('/closeByAppId') and data.get('errorText') == 'native app is not running':
            return data
        raise RuntimeError(data)
    return data


def mounted(target):
    return any(line.split()[1] == str(target) for line in pathlib.Path('/proc/mounts').read_text().splitlines())


def next_selection(saved, signature, count, shuffle=random.shuffle):
    """Persist a shuffled deck so every film appears before a repeat."""
    if count < 1:
        raise ValueError('Replik listesi boş')
    previous = saved.get('index', -1)
    remaining = saved.get('remaining', [])
    same_deck = saved.get('selection') == 'shuffle-bag' and saved.get('signature') == signature
    valid = isinstance(remaining, list) and all(type(i) is int and 0 <= i < count for i in remaining) and len(set(remaining)) == len(remaining) and previous not in remaining
    if not same_deck or not valid or not remaining:
        remaining = list(range(count))
        shuffle(remaining)
        if count > 1 and remaining[0] == previous:
            remaining[0], remaining[1] = remaining[1], remaining[0]
    index = remaining.pop(0)
    return {'index': index, 'remaining': remaining, 'selection': 'shuffle-bag', 'signature': signature, 'cycle': saved.get('cycle', 0) + (not same_deck or not valid or not saved.get('remaining'))}


def prepare(advance=False, within_session=False):
    # Only call after leaving ScreenSaver: Flutter reads this dictionary at startup.
    power = call('com.webos.service.tvpower/power/getPowerState', {}).get('state')
    if power != 'Active' and not (within_session and power in ('ScreenSaver', 'Screen Saver')):
        return
    quotes = json.loads((STATE / 'quotes.json').read_text())
    signature = hashlib.sha256(json.dumps(quotes, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    position = STATE / 'position.json'
    saved = json.loads(position.read_text()) if position.exists() else {}
    if advance or saved.get('selection') != 'shuffle-bag' or saved.get('signature') != signature or not 0 <= saved.get('index', -1) < len(quotes):
        saved = next_selection(saved, signature, len(quotes))
    index = saved['index']
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
    current = call('com.webos.service.tvpower/power/getPowerState', {}).get('state')
    if current == 'Active' or (within_session and current in ('ScreenSaver', 'Screen Saver')):
        call('com.webos.applicationManager/closeByAppId', {'id': APP})
        if within_session:
            call('com.webos.applicationManager/launch', {'id': APP})
    temp = position.with_suffix('.tmp')
    temp.write_text(json.dumps(saved) + '\n')
    temp.replace(position)
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
    try:
        prepare()
    except Exception as error:
        print('Initial preparation deferred: ' + str(error), flush=True)
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
                    try:
                        prepare(advance=True)
                    except Exception as error:
                        print('Quote preparation failed: ' + str(error), flush=True)
        except Exception as error:
            print('Power subscription reconnecting: ' + str(error), flush=True)
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
    elif action == 'refresh-test':
        prepare(advance=True, within_session=True)
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
