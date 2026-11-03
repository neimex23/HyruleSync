"""Integration check: intentionally stops ALL HyruleSync copies in this Windows session."""
import json, pathlib, shutil, subprocess, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP = ROOT / 'outputs/HyruleSync'
EXPECTED_CREDITS = json.loads((ROOT / 'assets/credits.json').read_text(encoding='utf-8-sig'))
children = []
decoy = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], creationflags=subprocess.CREATE_NO_WINDOW)
try:
    for name, language in [('english', 'en'), ('automatic', None)]:
        directory = ROOT / '.local/stopper-check' / name
        directory.mkdir(parents=True, exist_ok=True)
        shutil.copy2(APP / 'HyruleSync.exe', directory / 'HyruleSync.exe')
        urlfile = directory / 'url.txt'
        urlfile.unlink(missing_ok=True)
        args = [str(directory / 'HyruleSync.exe'), '--no-browser', '--url-file', str(urlfile)]
        if language:
            args += ['--language', language]
        process = subprocess.Popen(args, creationflags=subprocess.CREATE_NO_WINDOW)
        children.append(process)
        for _ in range(100):
            if urlfile.exists(): break
            time.sleep(.05)
        url = urlfile.read_text().replace('hyrulesync.localhost','127.0.0.1')
        def read(path):
            with urllib.request.urlopen(url + path, timeout=5) as response:
                return response.read()
        config = json.loads(read('api/config'))
        expected = language or ('es' if config['windowsCulture'].lower().startswith('es') else 'en')
        assert config['language'] == expected
        credits = json.loads(read('api/credits'))
        for key, value in EXPECTED_CREDITS.items():
            assert credits.get(key) == value, 'Packaged credits differ from source: ' + key
        assert read('legal/leaflet.txt') == (ROOT / 'licenses/Leaflet.txt').read_bytes()
        assert b'Neimex23' in read('legal/app.txt')
    result = subprocess.run([str(APP / 'HyruleSync.Stop.exe'), '--quiet'], timeout=12, creationflags=subprocess.CREATE_NO_WINDOW)
    assert result.returncode == 0
    assert all(process.wait(timeout=5) == 0 for process in children), 'A new instance required forced termination'
    assert decoy.poll() is None, 'An unrelated process was stopped'
    print('Windows language, credits, unchanged licenses, clean multi-instance shutdown and unrelated-process checks passed.')
finally:
    for process in children:
        if process.poll() is None: process.terminate()
    decoy.terminate()
    decoy.wait(timeout=5)
