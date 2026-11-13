/* Voyage Beyond - core: constants, crew, chapters and the simulation rules. */
window.VB = window.VB || {};

VB.W = 900;
VB.H = 500;
VB.FONT = 'BlockBlueprint, monospace';
VB.VERSION = '1.0.0';

VB.COL = {
    panel: 0x15142b, panelHi: 0x2a2850, edge: 0x6f6bd6,
    o2: 0x58c8ff, energy: 0xffd23f, food: 0x6fe06f, shield: 0xc58bff,
    hp: 0xff6b8b, dose: 0xff9a3c, danger: 0xff5a5a, good: 0x6fe06f
};

/* The four portraits from the Warped Portraits pack. */
VB.CREW = {
    cmd:  { key: 'cmd',  port: 'p1', base: 'b1', tex: 'astro_cmd', name: 'Cmdr. Aria Vance', short: 'Aria',
            role: 'Commander', perk: 'Storm response +25%', color: '#ffd27a', pitch: 520 },
    eng:  { key: 'eng',  port: 'p2', base: 'b2', tex: 'astro_eng', name: 'Jax Tremblay', short: 'Jax',
            role: 'Engineer', perk: 'Oxygen + power results +25%', color: '#d6a0ff', pitch: 380 },
    sci:  { key: 'sci',  port: 'p3', base: 'b3', tex: 'astro_sci', name: 'Dr. Sage Okoro', short: 'Sage',
            role: 'Life Scientist', perk: 'Garden + shield results +25%', color: '#7ff0d0', pitch: 450 },
    orbi: { key: 'orbi', port: 'p4', base: 'b4', tex: 'orbi', name: 'ORBI', short: 'ORBI',
            role: 'Outpost AI', perk: '', color: '#ff9ad5', pitch: 760 }
};

/* Per-chapter rules. Numbers are "game-scaled": each sol stands for about two weeks of mission time.
   Dose rates are real measurements (see README): Moon surface ~1.37 mSv/day (Chang'e-4 LND),
   Mars surface ~0.67 mSv/day (Curiosity RAD). */
VB.CHAPTERS = {
    moon: {
        key: 'moon', name: 'Shackleton Ridge Outpost', world: 'THE MOON', sols: 3,
        use: { o2: 24, energy: 26, food: 22 }, doseDay: 1.37, alerts: { 2: 'cme' },
        sunDist: 149.6e6
    },
    mars: {
        key: 'mars', name: 'Mars Outpost', world: 'MARS', sols: 3,
        use: { o2: 22, energy: 30, food: 24 }, doseDay: 0.67, alerts: { 2: 'cme', 3: 'dust' },
        sunDist: 227.9e6
    }
};

/* Action names/scenes differ between the Moon outpost and the Mars outpost. */
VB.ACTIONS = {
    moon: {
        oxygen: { scene: 'Oxygen', name: 'MAKE OXYGEN', sub: 'refinery game' }, solar: { scene: 'Solar', name: 'SOLAR ARRAY', sub: 'power game' },
        garden: { scene: 'Garden', name: 'TEND GARDEN', sub: 'food game' }, shield: { scene: 'Shield', name: 'SHIELD LAB', sub: 'radiation game' },
        storm: { scene: 'Storm', name: 'STORM WATCH', sub: 'space weather' }
    },
    mars: {
        oxygen: { scene: 'MarsOxygen', name: 'MOXIE REACTOR', sub: 'heat control game' }, solar: { scene: 'MarsSolar', name: 'ROVER CLEANER', sub: 'panel patrol game' },
        garden: { scene: 'MarsGarden', name: 'WATER LOOP', sub: 'pipe puzzle' }, shield: { scene: 'MarsShield', name: 'REGOLITH WALL', sub: 'stacking game' },
        storm: { scene: 'MarsStorm', name: 'SIREN WATCH', sub: 'storm timeline' }
    }
};
VB.act = (type) => VB.ACTIONS[VB.S ? VB.S.chapter : 'moon'][type];

VB.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
VB.fmt = (n) => Math.round(n).toLocaleString('en-US');

VB.newGame = function (role, name) {
    VB.S = {
        role: role || 'cmd', name: (name || 'Cadet').slice(0, 10),
        chapter: 'moon', sol: 1, ap: 3,
        res: { o2: 70, energy: 70, food: 70, shield: 20 },
        health: 100, dose: 0, site: null,
        did: {}, response: 0, alert: null, cmeIdx: 0, over: null, stars: 0,
        log: { storms: 0, stormsHandled: 0 }
    };
    return VB.S;
};

/* Role perks. */
VB.mult = function (type) {
    const S = VB.S; let m = 1;
    if (S.role === 'eng' && (type === 'oxygen' || type === 'solar')) m *= 1.25;
    if (S.role === 'sci' && (type === 'garden' || type === 'shield')) m *= 1.25;
    if (S.role === 'cmd' && type === 'storm') m *= 1.25;
    const mods = (S.site && S.site.mods) || {};
    if (S.chapter === 'mars') {
        if (type === 'garden' && mods.garden) m *= mods.garden;
        if (type === 'oxygen' && mods.o2) m *= mods.o2;
    }
    return m;
};

/* Apply a mini-game score (0..1) to the outpost. Returns a short reward string. */
VB.applyResult = function (type, score) {
    const S = VB.S, R = S.res, m = VB.mult(type);
    score = VB.clamp(score, 0, 1);
    S.did[type] = Math.max(S.did[type] || 0, score);
    const gain = (base, span) => Math.round((base + span * score) * m);
    let txt = '';
    if (type === 'garden') { const g = gain(6, 30); R.food = VB.clamp(R.food + g, 0, 100); txt = '+' + g + ' FOOD'; }
    if (type === 'oxygen') { const g = gain(6, 30); R.o2 = VB.clamp(R.o2 + g, 0, 100); txt = '+' + g + ' OXYGEN'; }
    if (type === 'solar')  { const g = gain(6, 30); R.energy = VB.clamp(R.energy + g, 0, 100); txt = '+' + g + ' POWER'; }
    if (type === 'shield') { const g = gain(4, 18); R.shield = VB.clamp(R.shield + g, 0, 100); txt = '+' + g + ' SHIELD'; }
    if (type === 'storm')  { S.response = VB.clamp(score * m, 0, 1); txt = 'CREW READINESS ' + Math.round(S.response * 100) + '%'; }
    return txt;
};

/* Pick the next real CME for an alert. */
VB.nextCME = function () {
    const list = VB.nasa.cmes;
    const e = list[VB.S.cmeIdx % list.length];
    VB.S.cmeIdx++;
    return e;
};

VB.rollAlert = function () {
    const S = VB.S, ch = VB.CHAPTERS[S.chapter];
    const kind = ch.alerts[S.sol];
    S.alert = null; S.response = 0;
    if (kind === 'cme') {
        const ev = VB.nextCME();
        const dose = VB.clamp(14 + ev.speed / 50, 20, 52);
        S.alert = { type: 'cme', ev, dose };
        S.log.storms++;
    } else if (kind === 'dust') {
        S.alert = { type: 'dust', energyLoss: 24 };
    }
};

VB.cmeEtaHours = function (speed, planet) {
    const d = VB.CHAPTERS[planet || VB.S.chapter].sunDist;
    return d / speed / 3600;
};

/* End the sol: consumption, radiation, storms. Returns a report. */
VB.endSol = function () {
    const S = VB.S, ch = VB.CHAPTERS[S.chapter], R = S.res;
    const mods = (S.site && S.site.mods) || {};
    const isMars = S.chapter === 'mars';
    const lines = [];
    const before = { o2: R.o2, energy: R.energy, food: R.food, health: S.health, dose: S.dose };

    R.o2 = Math.max(0, R.o2 - ch.use.o2);
    R.energy = Math.max(0, R.energy - Math.round(ch.use.energy * (isMars ? (mods.energyUse || 1) : 1)));
    R.food = Math.max(0, R.food - ch.use.food);

    // Radiation: real dose rate x 14 days, reduced by the shield.
    const weekly = ch.doseDay * 14 * (isMars ? (mods.dose || 1) : 1);
    let d = weekly * (1 - 0.7 * R.shield / 100);
    lines.push('Background radiation: +' + d.toFixed(1) + ' mSv');

    if (S.alert && S.alert.type === 'cme') {
        const handled = S.response;
        const storm = S.alert.dose * (1 - 0.8 * R.shield / 100) * (1 - 0.85 * handled);
        d += storm;
        if (handled >= 0.5) S.log.stormsHandled++;
        lines.push('Solar storm hit! +' + storm.toFixed(1) + ' mSv' + (handled > 0.5 ? ' (crew was sheltered)' : handled > 0 ? ' (partly sheltered)' : ' (NO warning!)'));
    } else if (S.alert && S.alert.type === 'dust') {
        const loss = S.did.solar ? Math.round(S.alert.energyLoss / 2) : S.alert.energyLoss;
        R.energy = Math.max(0, R.energy - loss);
        lines.push('Dust storm blocked sunlight: -' + loss + ' POWER' + (S.did.solar ? ' (panels were cleaned!)' : ''));
    }
    S.dose = Math.min(150, S.dose + d);

    let hp = 0;
    if (R.o2 <= 0) { hp -= 70; lines.push('OUT OF OXYGEN! Crew health -70'); }
    if (R.food <= 0) { hp -= 35; lines.push('Out of food. Crew health -35'); }
    if (R.energy <= 0) { hp -= 35; lines.push('Out of power. Crew health -35'); }
    if (hp === 0 && R.o2 >= 25 && R.food >= 25 && R.energy >= 25) { hp = 5; lines.push('Crew rested well. Health +5'); }
    S.health = VB.clamp(S.health + hp, 0, 100);

    if (S.health <= 0) S.over = 'health';
    else if (S.dose >= 100) S.over = 'dose';

    const after = { o2: R.o2, energy: R.energy, food: R.food, health: S.health, dose: S.dose };
    S.alert = null;
    return { lines, before, after };
};

VB.chapterDone = function () { return VB.S.sol > VB.CHAPTERS[VB.S.chapter].sols; };

VB.rank = function () {
    const S = VB.S;
    if (S.health >= 80 && S.dose <= 70) return 3;
    if (S.health >= 50 && S.dose <= 90) return 2;
    return 1;
};

/* Scene transition with a short fade. */
VB.go = function (scene, key, data) {
    const cam = scene.cameras.main;
    if (scene._leaving) return; scene._leaving = true;
    cam.fadeOut(220, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => { scene._leaving = false; scene.scene.start(key, data); });
};
