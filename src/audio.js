/* Audio: generative ambient space music + tiny sound effects, all synthesised with WebAudio
 * (no audio files, so no licences to worry about). M key or the on-screen button mutes.
 *
 * VB.music.create(ctx, out) builds the score engine on any AudioContext (also used offline for testing).
 */
(function () {
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

    /* Original score in the style of cinematic "organ + minimalist arpeggio" film music (think slow, vast, emotional space scores).
     * It does NOT reuse any melody or chord sequence from an existing soundtrack.
     * A step sequencer (16th notes) plays: pipe-organ chords, a repeating organ arpeggio (the "ostinato"), string swells,
     * a low drone, a soft piano-like motif, risers and (in the storm mood) a ticking clock.
     * arp = indexes into the chord (0-3 low octave, 4-7 octave up, -1 rest) for each 16th step of a bar.
     * mel = [step in chord, chord-tone index] for the piano motif. */
    const MOODS = {
        /* awe + hope: D minor, flowing 8th-note organ arpeggio, big swells */
        menu:  { bpm: 70, S: 64, prog: [[50, 57, 62, 65], [46, 53, 58, 62], [53, 57, 60, 65], [48, 55, 60, 64]], bass: [38, 34, 41, 36],
                 arp: [0, -1, 2, -1, 3, -1, 4, -1, 3, -1, 2, -1, 1, -1, 2, -1], arpUp: 12, arpVol: 1, swell: true, riser: true,
                 mel: [[16, 3], [32, 4], [44, 3], [56, 2]], cut: 2200 },
        /* the Moon: C minor, slow and lonely, quarter-note arpeggio, deep drone */
        moon:  { bpm: 58, S: 64, prog: [[48, 55, 60, 63], [44, 51, 56, 60], [51, 55, 58, 63], [46, 53, 58, 62]], bass: [36, 32, 39, 34],
                 arp: [0, -1, -1, -1, 2, -1, -1, -1, 3, -1, -1, -1, 2, -1, -1, -1], arpUp: 12, arpVol: 0.9, swell: true, riser: false,
                 mel: [[24, 3], [48, 4]], cut: 1800, drone: true },
        /* Mars: A minor, vast and driving, steady 8th-note arpeggio, low drone */
        mars:  { bpm: 78, S: 64, prog: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 52, 55, 60], [43, 50, 55, 59]], bass: [33, 29, 36, 31],
                 arp: [0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 3, -1, 2, -1], arpUp: 12, arpVol: 1, swell: true, riser: true,
                 mel: [[8, 3], [28, 4], [40, 3], [60, 2]], cut: 2000, drone: true },
        /* storm drill: tense, ticking clock, fast 16th-note arpeggio, rising swells */
        storm: { bpm: 96, S: 32, prog: [[47, 50, 53, 56], [43, 50, 55, 58], [44, 51, 56, 60], [43, 50, 53, 59]], bass: [35, 31, 32, 31],
                 arp: [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 2, 3], arpUp: 12, arpVol: 0.8, swell: true, riser: true, tick: true,
                 mel: [], cut: 2600 }
    };

    VB.music = {
        create(ctx, out) {
            // big hall reverb: generated noise impulse with a long exponential tail
            const rate = ctx.sampleRate, len = Math.floor(rate * 4.2), imp = ctx.createBuffer(2, len, rate);
            for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
            const verb = ctx.createConvolver(); verb.buffer = imp;
            const wet = ctx.createGain(); wet.gain.value = 0.9; verb.connect(wet); wet.connect(out);
            const dry = ctx.createGain(); dry.gain.value = 0.55; dry.connect(out);
            const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(dry); bus.connect(verb);
            const dl = ctx.createDelay(1.5); dl.delayTime.value = 0.5; const fb = ctx.createGain(); fb.gain.value = 0.3; dl.connect(fb); fb.connect(dl); dl.connect(bus);
            const nb = ctx.createBuffer(1, rate, rate), nd = nb.getChannelData(0); for (let i = 0; i < rate; i++) nd[i] = Math.random() * 2 - 1;

            const st = { mood: 'menu', nextT: 0, step: 0, ci: 0, chord: [50, 57, 62, 65], bassNote: 38 };
            const HARM = [[1, 1], [2, 0.5], [3, 0.3], [4, 0.14], [6, 0.06]];   // pipe-organ harmonic stack

            /* sustained pipe-organ note */
            function organ(t, f, dur, vol, cut) {
                const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.5;
                g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.9); g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.8);
                HARM.forEach(([h, a], i) => { [-4, 4].forEach(det => { const o = ctx.createOscillator(), og = ctx.createGain(); og.gain.value = a * 0.5; o.type = 'sine'; o.frequency.value = f * h; o.detune.value = det; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 2); }); });
                lp.connect(g); g.connect(bus);
            }
            /* short organ note for the arpeggio ("ostinato") */
            function ostinato(t, m, dur, vol) {
                const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
                g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.025); g.gain.exponentialRampToValueAtTime(vol * 0.55, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.28);
                [[1, 1], [2, 0.55], [3, 0.3], [4, 0.12]].forEach(([h, a]) => { const o = ctx.createOscillator(), og = ctx.createGain(); og.gain.value = a; o.type = 'sine'; o.frequency.value = f * h; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.32); });
                lp.connect(g); g.connect(bus); g.connect(dry);
            }
            /* string-ensemble swell: slow crescendo then fade */
            function swell(t, notes, dur, vol) {
                const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
                lp.frequency.setValueAtTime(350, t); lp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.7); lp.frequency.exponentialRampToValueAtTime(500, t + dur + 1.5);
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.8);
                notes.forEach(n => [-9, 0, 9].forEach(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 2); }));
                lp.connect(g); g.connect(bus);
            }
            function drone(t, m, dur) {
                const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1, t + dur * 0.4); g.gain.setValueAtTime(0.1, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.2);
                [[1, 1], [2, 0.3]].forEach(([h, a]) => { const o = ctx.createOscillator(), og = ctx.createGain(); og.gain.value = a; o.type = h === 1 ? 'sine' : 'triangle'; o.frequency.value = mtof(m) * h; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 2.4); });
                g.connect(dry);
            }
            /* soft piano-like note for the little melody */
            function piano(t, m) {
                const f = mtof(m), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
                [[1, 1, 'triangle'], [2, 0.3, 'sine'], [3, 0.1, 'sine']].forEach(([h, a, type]) => { const o = ctx.createOscillator(), og = ctx.createGain(); og.gain.value = a; o.type = type; o.frequency.value = f * h; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.5); });
                g.connect(bus); g.connect(dl);
            }
            function tick(t, accent) {
                const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = 7;
                g.gain.setValueAtTime(accent ? 0.11 : 0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); s.connect(f); f.connect(g); g.connect(dry); s.start(t, Math.random() * 0.4); s.stop(t + 0.07);
                const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = accent ? 1500 : 1900; og.gain.setValueAtTime(accent ? 0.035 : 0.02, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045); o.connect(og); og.connect(dry); o.start(t); o.stop(t + 0.06);
            }
            function riser(t, dur) {
                const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; s.loop = true; f.type = 'bandpass'; f.Q.value = 1.2;
                f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4200, t + dur);
                g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04, t + dur * 0.92); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
                s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.35);
            }

            function doStep(t) {
                const M = MOODS[st.mood], k = st.step % M.S, stepDur = 60 / M.bpm / 4, kk = st.step % 16;
                if (k === 0) {
                    const i = st.ci % M.prog.length; st.chord = M.prog[i]; st.bassNote = M.bass[i]; st.ci++;
                    const dur = M.S * stepDur;
                    st.chord.forEach((n, j) => organ(t + j * 0.08, mtof(n), dur, 0.011, M.cut));
                    organ(t, mtof(st.bassNote), dur, 0.02, 700);                      // pedal note
                    if (M.drone) drone(t, st.bassNote - 12, dur);
                    if (M.swell) swell(t, [st.chord[1], st.chord[2], st.chord[3] + 12], dur, 0.022);
                    dl.delayTime.setTargetAtTime(stepDur * 4, t, 0.1);
                }
                if (M.riser && k === M.S - 24 && st.ci % 4 === 0) riser(t, 24 * stepDur);
                const a = M.arp[kk];
                if (a >= 0) ostinato(t, st.chord[a % 4] + (a >= 4 ? 12 : 0) + M.arpUp, stepDur * (kk % 2 ? 1 : 2) * 1.4, 0.03 * (M.arpVol || 1) * (kk === 0 ? 1.2 : 1));
                (M.mel || []).forEach(([ms, ci]) => { if (k === ms) piano(t, st.chord[ci % 4] + (ci >= 4 ? 12 : 0) + 12); });
                if (M.tick && kk % 4 === 0) tick(t, kk === 0);
                st.step++;
                return stepDur;
            }
            return {
                st,
                setMood(m) { if (MOODS[m] && m !== st.mood) { st.mood = m; st.step = 0; } },
                schedule(until) { let guard = 0; while (st.nextT < until && guard++ < 4000) st.nextT += doStep(st.nextT); }
            };
        }
    };

    VB.audio = {
        ctx: null, muted: false, master: null, sfx: null, engine: null, timer: null, mood: 'menu', wantMood: 'menu',
        init() {
            if (this.ctx) { if (this.ctx.state === 'suspended' && !this.muted && !document.hidden) this.ctx.resume(); return; }
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; return; }
            const c = this.ctx;
            try { this.muted = localStorage.getItem('vb_muted') === '1'; } catch (e) {}
            const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(c.destination);
            this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 1; this.master.connect(comp);
            this.sfx = c.createGain(); this.sfx.gain.value = 1.8; this.sfx.connect(this.master);
            const music = c.createGain(); music.gain.value = 1.9; music.connect(this.master);
            this.engineGain = c.createGain(); this.engineGain.gain.value = 1; this.engineGain.connect(music);
            this.engine = VB.music.create(c, this.engineGain);
            this.engine.st.nextT = c.currentTime + 0.2;
            this.engine.setMood(this.wantMood);
            this.engine.schedule(c.currentTime + 3);
            this.timer = setInterval(() => { if (this.ctx.state === 'running') this.engine.schedule(this.ctx.currentTime + 3); }, 400);
            document.addEventListener('visibilitychange', () => { if (!this.ctx) return; if (document.hidden) this.ctx.suspend(); else if (!this.muted) this.ctx.resume(); });
            if (this.muted) this.ctx.suspend();
            this.paint(); this.loadTracks();
        },
        /* Optional: play your OWN licensed audio files instead of the built-in score (see data/music-config.js). */
        tracks: {}, cur: null,
        loadTracks() {
            const files = VB.musicFiles || {};
            Object.keys(files).forEach(mood => {
                fetch(files[mood]).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
                    .then(buf => new Promise((res, rej) => this.ctx.decodeAudioData(buf, res, rej)))
                    .then(audio => { this.tracks[mood] = audio; this.applyMood(); })
                    .catch(e => console.warn('[Voyage Beyond] could not load music for "' + mood + '" (' + files[mood] + '): ' + e.message + '. Using the built-in score.'));
            });
        },
        applyMood() {
            if (!this.ctx) return; const c = this.ctx, now = c.currentTime, track = this.tracks[this.wantMood];
            if (this.engine) this.engine.setMood(this.wantMood);
            if (this.cur && (!track || this.cur.mood !== this.wantMood)) {
                const old = this.cur; this.cur = null; old.gain.gain.cancelScheduledValues(now); old.gain.gain.setValueAtTime(old.gain.gain.value, now); old.gain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
                setTimeout(() => { try { old.src.stop(); } catch (e) {} }, 1700);
            }
            if (track && !this.cur) {
                const src = c.createBufferSource(), g = c.createGain(); src.buffer = track; src.loop = true; g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.85, now + 1.5);
                src.connect(g); g.connect(this.master); src.start(); this.cur = { src, gain: g, mood: this.wantMood };
            }
            this.engineGain.gain.setTargetAtTime(track ? 0.0001 : 1, now, 0.6);
        },
        setMood(m) { this.wantMood = m; if (this.engine) this.applyMood(); },
        toggle() {
            if (!this.ctx) this.init();
            this.muted = !this.muted;
            try { localStorage.setItem('vb_muted', this.muted ? '1' : '0'); } catch (e) {}
            if (this.ctx) {
                this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
                if (this.muted) setTimeout(() => { if (this.muted) this.ctx.suspend(); }, 300); else this.ctx.resume();
            }
            this.paint(); return this.muted;
        },
        paint() { const b = document.getElementById('mute'); if (b) { b.textContent = this.muted ? 'SOUND OFF' : 'SOUND ON'; b.classList.toggle('off', this.muted); } },
        tone(f, d, type, vol, slide, delay) {
            if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
            const c = this.ctx, t0 = c.currentTime + (delay || 0);
            const o = c.createOscillator(), g = c.createGain();
            o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
            if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
            g.gain.setValueAtTime(vol || 0.05, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
            o.connect(g); g.connect(this.sfx); o.start(t0); o.stop(t0 + d + 0.02);
        },
        click() { this.tone(520, 0.06, 'square', 0.04); },
        blip(p) { this.tone((p || 500) + Math.random() * 40, 0.04, 'square', 0.025); },
        good() { this.tone(660, 0.09, 'square', 0.05); this.tone(880, 0.12, 'square', 0.05, 0, 0.08); },
        coin() { this.tone(900, 0.05, 'square', 0.04); this.tone(1350, 0.08, 'square', 0.04, 0, 0.05); },
        bad() { this.tone(220, 0.18, 'sawtooth', 0.06, -120); },
        alarm() { for (let i = 0; i < 3; i++) { this.tone(700, 0.15, 'square', 0.05, 0, i * 0.3); this.tone(520, 0.15, 'square', 0.05, 0, i * 0.3 + 0.15); } },
        win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'square', 0.05, 0, i * 0.12)); },
        lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.22, 'sawtooth', 0.05, 0, i * 0.18)); },
        whoosh() { this.tone(300, 0.25, 'triangle', 0.05, 500); }
    };

    /* Browsers only allow audio after a user gesture: start on the first click/tap/key anywhere. */
    const unlock = () => VB.audio.init();
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { once: false, passive: true }));
    window.addEventListener('keydown', e => {
        if ((e.key === 'm' || e.key === 'M') && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) VB.audio.toggle();
    });
    window.addEventListener('load', () => {
        const b = document.getElementById('mute');
        if (b) { b.addEventListener('click', e => { e.stopPropagation(); VB.audio.toggle(); }); b.addEventListener('pointerdown', e => e.stopPropagation()); }
        VB.audio.paint();
    });
})();
