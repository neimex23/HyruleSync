'use strict';

// Exercise the public HTTP contract against an isolated first-run app copy.
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = path.resolve(process.argv[2] || path.join(root, 'outputs/HyruleSync'));
fs.mkdirSync(path.join(root, '.local'), { recursive: true });
const work = fs.mkdtempSync(path.join(root, '.local/http-test-'));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let child, exited, url, origin;

async function start() {
    fs.copyFileSync(path.join(app, 'HyruleSync.exe'), path.join(work, 'HyruleSync.exe'));
    fs.mkdirSync(path.join(work, '.state'));
    fs.writeFileSync(path.join(work, '.state/settings.json'), JSON.stringify({ runInBackground: true }));
    const urlFile = path.join(work, 'url.txt');
    child = cp.spawn(path.join(work, 'HyruleSync.exe'),
        ['--no-browser', '--language', 'en', '--url-file', urlFile], { windowsHide: true });
    let startError;
    child.once('error', error => { startError = error; });
    exited = new Promise(resolve => child.once('exit', resolve));
    for (let i = 0; i < 100 && !fs.existsSync(urlFile) && !startError; i++) await pause(100);
    if (startError) throw startError;
    assert.ok(fs.existsSync(urlFile), 'App starts');
    url = fs.readFileSync(urlFile, 'utf8');
    origin = new URL(url).origin;
}

function request(target, { method = 'GET', headers = {}, body = '' } = {}) {
    return new Promise((resolve, reject) => {
        if (method === 'POST') headers = { 'Content-Length': Buffer.byteLength(body), ...headers };
        // Node uses Windows DNS, unlike browsers' built-in *.localhost resolution.
        const req = http.request(new URL(target, url), {
            method, headers, lookup: (_hostname, options, done) => options.all
                ? done(null, [{ address: '127.0.0.1', family: 4 }]) : done(null, '127.0.0.1', 4)
        }, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.once('end', () => resolve({
                status: response.statusCode, reason: response.statusMessage,
                headers: response.headers, body: Buffer.concat(chunks)
            }));
        });
        req.setTimeout(5000, () => req.destroy(Error('HTTP request timed out')));
        req.once('error', reject);
        req.end(body);
    });
}

function json(response, status = 200) {
    assert.equal(response.status, status);
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(Number(response.headers['content-length']), response.body.length);
    return JSON.parse(response.body.toString('utf8').replace(/^\uFEFF/, ''));
}

function post(action, body = '') {
    return request('api/' + action, { method: 'POST', headers: { Origin: origin }, body });
}

function malformedPost(length, body = '') {
    return new Promise((resolve, reject) => {
        const address = new URL(url);
        const socket = net.createConnection({ host: '127.0.0.1', port: Number(address.port) });
        let received = '';
        socket.setTimeout(5000, () => socket.destroy(Error('Malformed request timed out')));
        socket.once('error', reject);
        socket.on('data', data => { received += data.toString(); });
        socket.once('close', () => resolve(received));
        socket.once('connect', () => socket.end(
            'POST ' + address.pathname + 'api/link-opacity HTTP/1.1\r\n'
            + 'Host: ' + address.host + '\r\nOrigin: ' + origin + '\r\n'
            + (length === null ? '' : 'Content-Length: ' + length + '\r\n')
            + '\r\n' + body));
    });
}

(async () => {
    try {
        await start();
        const address = new URL(url);
        assert.equal(address.hostname, 'hyrulesync.localhost', 'Friendly local name requires no DNS setup');
        assert.equal(json(await request('api/config', { headers: { Host: address.host.toUpperCase() } })).language, 'en');
        const ipOrigin = 'http://127.0.0.1:' + address.port;
        assert.equal(json(await request('api/config', { headers: { Host: '127.0.0.1:' + address.port, Origin: ipOrigin } })).language, 'en');
        assert.equal((await request('api/config', { headers: { Origin: ipOrigin } })).status, 403, 'Origin must match the requested host');
        assert.equal(json(await request('api/config')).language, 'en');
        const credits = json(await request('api/credits'));
        const updates = json(await request('api/updates'));
        assert.match(credits.version, /^\d+\.\d+\.\d+$/);
        assert.equal(credits.version, updates.currentVersion, 'Credits and update checks use the compiled assembly version');
        assert.equal(json(await request('api/setup')).ready, false);
        assert.deepEqual(json(await request('catalog.json')), {});
        assert.deepEqual(json(await request('api/saves')).slots, []);
        assert.ok(Array.isArray(json(await request('api/source-options')).choices));
        const folders = json(await request('api/folders?path=' + encodeURIComponent(work)));
        assert.equal(folders.path, work);
        assert.ok(Array.isArray(folders.folders));
        const missingFolder = await request('api/folders?path=' + encodeURIComponent(path.join(work, 'missing')));
        assert.ok(json(missingFolder, 400).error);
        assert.equal(missingFolder.reason, 'Bad Request');

        const page = await request('');
        const html = page.body.toString('utf8');
        assert.match(html, /<script[^>]+type="module"[^>]+src="\.\/app\.js"/);
        assert.doesNotMatch(html, /src\/main\.jsx/, 'The executable serves the compiled interface');
        const generatedAssets = [...html.matchAll(/(?:src|href)="\.\/([^"]+\.(?:js|css))"/g)].map(match => match[1]);
        assert.ok(generatedAssets.some(file => file.endsWith('.css')), 'The bundled stylesheet is linked');
        for (const [target, file, mime] of [
            ...generatedAssets.map(file => [file, null, file.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/css; charset=utf-8']),
            ...fs.readdirSync(path.join(root,'web/public')).map(file => [file, 'web/public/'+file, {'.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]]),
            ['', null, 'text/html; charset=utf-8'],
            ['index.html', null, 'text/html; charset=utf-8'],
            ['legal/react.txt','licenses/React.txt','text/plain; charset=utf-8'],
            ['legal/app.txt', 'LICENSE', 'text/plain; charset=utf-8'],
            ['legal/leaflet.txt', 'licenses/Leaflet.txt', 'text/plain; charset=utf-8'],
            ['legal/savegame-editors.txt', 'licenses/SavegameEditors.txt', 'text/plain; charset=utf-8'],
            ['legal/third-party.en.md', 'THIRD_PARTY.md', 'text/plain; charset=utf-8'],
            ['legal/third-party.es.md', 'docs/THIRD_PARTY.es.md', 'text/plain; charset=utf-8']
        ]) {
            const response = await request(target);
            assert.equal(response.status, 200, target);
            assert.equal(response.headers['content-type'], mime, target);
            if (file) assert.deepEqual(response.body, fs.readFileSync(path.join(root, file)), target);
            else if (!target || target === 'index.html') assert.deepEqual(response.body, page.body, target);
            else assert.ok(response.body.length > 0, target + ' is embedded and served after intermediate cleanup');
            assert.equal(Number(response.headers['content-length']), response.body.length);
            assert.equal(response.headers['cache-control'], mime === 'image/png' ? 'private, max-age=86400' : 'no-store');
            assert.equal(response.headers['x-content-type-options'], 'nosniff');
            assert.equal(response.headers['referrer-policy'], 'no-referrer');
            assert.ok(response.headers['content-security-policy'].includes("frame-ancestors 'none'"));
        }

        // HD tiles are immutable per coordinate and can stay in the browser cache.
        const tile = Buffer.alloc(30);
        tile.write('RIFF', 0, 'ascii'); tile.writeUInt32LE(22, 4);
        tile.write('WEBPVP8 ', 8, 'ascii');
        tile[23] = 0x9d; tile[24] = 1; tile[25] = 0x2a; tile[27] = 1; tile[29] = 1;
        const tileDirectory = path.join(work, '.data/hd-map/zeldamods-v1/surface/7/93');
        fs.mkdirSync(tileDirectory, { recursive: true });
        fs.writeFileSync(path.join(tileDirectory, '78.webp'), tile);
        for (let i = 0; i < 2; i++) {
            const cachedTile = await request('map-tiles/surface/7/93/78.webp');
            assert.equal(cachedTile.status, 200);
            assert.equal(cachedTile.headers['content-type'], 'image/webp');
            assert.equal(cachedTile.headers['cache-control'], 'private, max-age=31536000, immutable');
            assert.deepEqual(cachedTile.body, tile);
        }

        for (const target of ['missing', 'api/missing', 'src/HttpServer.cs', '.state/settings.json', 'vendor/missing.js', 'src/main.jsx', 'src/controller.js', 'package.json'])
            assert.equal((await request(target)).status, 404, target);
        assert.equal((await request('../package.json')).status, 403, 'Traversal outside the private session is rejected');
        for (const headers of [{ Host: 'example.invalid' }, { Host: address.hostname + ':1' },
            { Host: 'hyrulesync:' + address.port }, { Host: 'other.localhost:' + address.port },
            { Origin: 'https://example.invalid' }, { Origin: 'http://hyrulesync.localhost:1' }])
            assert.equal((await request('api/config', { headers })).status, 403);
        assert.equal((await request(origin + '/invalid-token/api/config')).status, 403);
        for (const method of ['PUT', 'DELETE', 'OPTIONS'])
            assert.equal((await request('api/config', { method })).status, 405);
        const withoutOrigin = await request('api/follow-on', { method: 'POST' });
        assert.equal(withoutOrigin.status, 405);
        assert.equal(withoutOrigin.reason, 'Method Not Allowed');
        assert.equal((await request('api/follow-on', {
            method: 'POST', headers: { Origin: 'https://example.invalid' }
        })).status, 403);
        const initialState = json(await request('api/state'));
        assert.equal(initialState.followLink, false);
        assert.equal(initialState.showLink, true);
        assert.equal(initialState.linkOrder, 'below');
        assert.equal(initialState.linkOpacity, 45);
        assert.equal((await request('app.js', { method: 'POST', headers: { Origin: origin } })).status, 405);

        for (const [action, field, expected] of [
            ['follow-off', 'followLink', false], ['follow-on', 'followLink', true],
            ['hide-link', 'showLink', false], ['show-link', 'showLink', true],
            ['link-below', 'linkOrder', 'below'], ['link-above', 'linkOrder', 'above'],
            ['background-off', 'runInBackground', false], ['background-on', 'runInBackground', true]
        ]) {
            assert.deepEqual(json(await post(action)), { ok: true, error: null });
            assert.equal(json(await request('api/state'))[field], expected, action);
            const saved = JSON.parse(fs.readFileSync(path.join(work, '.state/settings.json'), 'utf8').replace(/^\uFEFF/, ''));
            assert.equal(saved[field], expected, 'Persist ' + action);
        }
        for (const value of ['0', '100', ' 35 ']) assert.equal(json(await post('link-opacity', value)).ok, true);
        for (const value of ['-1', '101', 'NaN', '0.5', '']) assert.equal(json(await post('link-opacity', value), 400).ok, false);
        assert.equal(json(await request('api/state')).linkOpacity, 35);
        assert.equal(json(await post('page-close', 'a'.repeat(32))).ok, true);
        for (const id of ['a'.repeat(31), 'A'.repeat(32), ' ' + 'a'.repeat(32)])
            assert.equal(json(await post('page-close', id), 400).ok, false);

        for (const action of ['inspect-file', 'inspect-upload', 'upload', 'set-file', 'set-folder', 'refresh', 'auto-on', 'auto-off', 'missing']) {
            const result = json(await post(action, Buffer.from([0, 255, 13, 10])), 400);
            assert.equal(result.ok, false, action);
            assert.equal(result.error, 'Prepare the map resources first.', action);
        }
        for (const length of [null, '-1', '4194305', 'invalid', '3']) {
            assert.equal(await malformedPost(length, length === '3' ? '1' : ''), '');
            assert.equal(json(await request('api/state')).linkOpacity, 35, 'Malformed request leaves the listener and state intact');
        }
        console.log('HTTP routes, assets, settings, authorization, setup requirements and malformed requests passed.');
    } finally {
        if (child && child.exitCode === null && child.pid) {
            child.kill();
            await exited;
        }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
