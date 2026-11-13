/* NASA data layer.
 *   DONKI  (api.nasa.gov/DONKI)       - space-weather events: CMEs and solar flares
 *   OSDR   (osdr.nasa.gov)            - Open Science Data Repository: plant/radiation biology studies
 *   RadLab (OSDR RadLab)              - ground radiation experiment facts used in the shield mini-game
 *   Mars Trek (trek.nasa.gov/mars)    - Mars map tiles for the landing-site mini-game (see landing.js)
 *
 * Everything is fetched live in the player's browser. If a request fails (offline, rate limit),
 * the game quietly falls back to data/snapshot.js and labels the data "OFFLINE REFERENCE".
 */
VB.nasa = {
    key: (function () { try { return new URLSearchParams(location.search).get('nasa_key') || 'DEMO_KEY'; } catch (e) { return 'DEMO_KEY'; } })(),
    status: { donki: 'loading', osdr: 'loading' },
    cmes: [], flares: [], osdr: [], live: false, ready: null,

    async getJSON(url, ms) {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 9000);
        try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
        finally { clearTimeout(t); }
    },
    ymd(d) { return d.toISOString().slice(0, 10); },

    normCME(e) {
        const list = e.cmeAnalyses || [];
        const a = list.find(x => x.isMostAccurate) || list[0];
        if (!a || !a.speed) return null;
        return { id: e.activityID, time: e.startTime, src: e.sourceLocation || 'unknown', speed: Math.round(a.speed),
                 type: a.type || '?', half: a.halfAngle, note: (e.note || '').replace(/\s+/g, ' ').slice(0, 170), live: true };
    },
    normFlare(e) { return { id: e.flrID, time: (e.beginTime || '').slice(0, 10), cls: e.classType, src: e.sourceLocation || '', live: true }; },

    async loadDonki() {
        const cacheKey = 'vb_donki_v1';
        try {
            const c = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (c && Date.now() - c.t < 6 * 3600e3 && c.cmes.length >= 3) { this.cmes = c.cmes; this.flares = c.flares; return true; }
        } catch (e) {}
        const now = new Date();
        for (const days of [30, 90, 180]) {
            const start = new Date(now - days * 864e5);
            const q = `startDate=${this.ymd(start)}&endDate=${this.ymd(now)}&api_key=${this.key}`;
            const raw = await this.getJSON(`https://api.nasa.gov/DONKI/CME?${q}`);
            const cmes = (raw || []).map(e => this.normCME(e)).filter(Boolean).sort((a, b) => b.speed - a.speed);
            if (cmes.length >= 3) {
                // keep a spread of speeds so kids see slow and fast ones
                const pick = [cmes[0], cmes[Math.floor(cmes.length / 2)], cmes[cmes.length - 1], cmes[Math.floor(cmes.length / 4)], cmes[Math.floor(cmes.length * 0.75)]];
                this.cmes = pick.filter((v, i, a) => v && a.indexOf(v) === i);
                try {
                    const fl = await this.getJSON(`https://api.nasa.gov/DONKI/FLR?${q}`);
                    this.flares = (fl || []).map(e => this.normFlare(e)).filter(f => f.cls).sort((a, b) => (b.time > a.time ? 1 : -1)).slice(0, 5);
                } catch (e) { this.flares = []; }
                try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), cmes: this.cmes, flares: this.flares })); } catch (e) {}
                return true;
            }
        }
        throw new Error('not enough CME events');
    },

    async loadOsdr() {
        const raw = await this.getJSON('https://osdr.nasa.gov/osdr/data/search?term=plant%20spaceflight&type=cgene&from=0&size=6');
        const hits = (raw && raw.hits && raw.hits.hits) || [];
        const out = hits.map(h => {
            const s = h._source || h;
            const title = s['Study Title'] || s.title || s['study title'] || s.Title;
            const id = s['Study Identifier'] || s.accession || s.identifier || h._id;
            return title ? { title: String(title).slice(0, 120), id: id ? String(id) : null, note: '', live: true } : null;
        }).filter(Boolean);
        if (!out.length) throw new Error('no OSDR studies');
        this.osdr = out;
    },

    start() {
        const snap = VB.snapshot;
        this.cmes = snap.cmes.slice(); this.flares = snap.flares.slice(); this.osdr = snap.osdr.slice();
        this.ready = Promise.allSettled([
            this.loadDonki().then(() => { this.status.donki = 'live'; this.live = true; })
                .catch(() => { this.status.donki = 'offline'; this.cmes = snap.cmes.slice(); this.flares = snap.flares.slice(); }),
            this.loadOsdr().then(() => { this.status.osdr = 'live'; })
                .catch(() => { this.status.osdr = 'offline'; this.osdr = snap.osdr.slice(); })
        ]);
        return this.ready;
    },
    badge() { return this.status.donki === 'live' ? 'LIVE NASA DONKI DATA' : this.status.donki === 'loading' ? 'CONNECTING TO NASA...' : 'OFFLINE REFERENCE DATA'; },
    badgeColor() { return this.status.donki === 'live' ? '#6fe06f' : this.status.donki === 'loading' ? '#ffd23f' : '#ff9a3c'; }
};
