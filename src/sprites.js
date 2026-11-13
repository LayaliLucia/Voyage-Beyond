/* All pixel art in the game is drawn in code at tiny resolution and scaled up with nearest-neighbour. */
VB.gfx = {
    rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
    tex(scene, key, w, h, fn) {
        if (scene.textures.exists(key)) return;
        const t = scene.textures.createCanvas(key, w, h); const c = t.getContext();
        c.imageSmoothingEnabled = false; fn(c, w, h); t.refresh();
    },
    grid(scene, key, rows, pal) {
        const w = Math.max(...rows.map(r => r.length)), h = rows.length;
        this.tex(scene, key, w, h, c => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x, y, 1, 1); } })));
    },
    px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); },
    disc(c, cx, cy, r, col) {
        c.fillStyle = col;
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) c.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
};

VB.makeTextures = function (scene) {
    const G = VB.gfx, px = G.px, disc = G.disc;

    /* ---------- astronauts (one palette per crew member) ---------- */
    const astro = [
        "....dddd....", "..ddhhhhdd..", ".dhhvvvvhhd.", ".dhvVvvvvhd.", ".dhvvvvvvhd.", ".dHhvvvvhHd.",
        "..ddHhhHdd..", "..dssaassd..", ".dsssaasssd.", "dsdsaaaasdsd", "dsdssssssdsd", ".dddssssddd.",
        "..dssddssd..", "..dssddssd..", "..dbbddbbd..", ".dbbbddbbbd."
    ];
    const base = { d: '#1b1b2f', h: '#f4f6fb', H: '#c9d1e3', v: '#4ac3ff', V: '#c8f3ff', b: '#5b5f73' };
    G.grid(scene, 'astro_cmd', astro, { ...base, s: '#f2f2f2', a: '#ff8a3d' });
    G.grid(scene, 'astro_eng', astro, { ...base, s: '#ffd91a', a: '#8a3cf0', v: '#2a2a2a', V: '#777777' });
    G.grid(scene, 'astro_sci', astro, { ...base, s: '#2fd1b0', a: '#1e3a8a' });
    G.grid(scene, 'orbi', [
        "....dddddd....", "..ddvvvvvvdd..", ".dvVVvvvvvvvd.", ".dvVvvvvvvvvd.", "dvvvvvvvvvvvvd",
        "dPpppppppppPPd", "dpppeppppeppPd", "dpppppppppppPd", ".dppppppppPPd.", "..dQPppppPQd..", "...ddQQQQdd..."
    ], { d: '#2a1030', p: '#ff5fb0', P: '#c42b86', Q: '#8a1d63', v: '#5fd0ff', V: '#d8f6ff', e: '#1b1b2f' });

    /* ---------- icons ---------- */
    G.grid(scene, 'ic_o2', ["..eeee..", ".e....e.", "e..ww..e", "e..w...e", "e......e", "e......e", ".e....e.", "..eeee.."], { e: '#58c8ff', w: '#ffffff' });
    G.grid(scene, 'ic_energy', ["....yy..", "...yy...", "..yy....", ".yyyyyy.", "...yyy..", "..yy....", ".yy.....", "y......."], { y: '#ffd23f' });
    G.grid(scene, 'ic_food', [".....gg.", "....g...", "..rrrrr.", ".rrRrrrr", ".rrrrrrr", ".rrrrrrr", "..rrrrr.", "...rr.r."], { g: '#6fe06f', r: '#ff5a5a', R: '#ffb0b0' });
    G.grid(scene, 'ic_shield', ["bbbbbbbb", "bwwyywwb", "bwyyyywb", "bwwyywwb", ".bwwwwb.", ".bwwwwb.", "..bwwb..", "...bb..."], { b: '#c58bff', w: '#4a2a80', y: '#ffe14a' });
    G.grid(scene, 'star_on', ["....y....", "....y....", "...yyy...", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy..", ".yyy.yyy.", ".yy...yy.", "y.......y"], { y: '#ffd23f' });
    G.grid(scene, 'star_off', ["....y....", "....y....", "...yyy...", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy..", ".yyy.yyy.", ".yy...yy.", "y.......y"], { y: '#3a3858' });

    /* ---------- backgrounds (225x73, drawn x4) ---------- */
    G.tex(scene, 'bg_moon', 225, 73, (c, w, h) => {
        const r = G.rng(11);
        // Earth in the sky
        disc(c, 178, 14, 7, '#2f6fe0'); disc(c, 176, 12, 3, '#3fae5a'); disc(c, 181, 17, 2, '#3fae5a');
        px(c, 172, 11, 4, 1, '#ffffff'); px(c, 180, 14, 3, 1, '#ffffff'); px(c, 174, 18, 5, 1, '#dfe8ff');
        // far hills
        let hy = 36; for (let x = 0; x < w; x++) { hy += (r() - 0.5) * 1.6; hy = VB.clamp(hy, 33, 38); px(c, x, Math.round(hy), 1, 40, '#6e6e7e'); }
        // ground
        for (let y = 38; y < h; y++) {
            const t = (y - 38) / 35, base = [150 - t * 55, 150 - t * 55, 162 - t * 55];
            for (let x = 0; x < w; x++) {
                const n = (r() - 0.5) * 16; const hy2 = 38;
                if (y < hy2 - 1) continue;
                c.fillStyle = `rgb(${base[0] + n | 0},${base[1] + n | 0},${base[2] + n | 0})`; c.fillRect(x, y, 1, 1);
            }
        }
        // craters
        for (let i = 0; i < 9; i++) {
            const cx = 10 + r() * 205, cy = 44 + r() * 26, rx = 4 + r() * 9, ry = rx * 0.35;
            for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
                const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
                if (d <= 1) { c.fillStyle = y > 0 ? '#7d7d8d' : '#4d4d5b'; c.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); }
                else if (d <= 1.35 && y < 0) { c.fillStyle = '#aeaebe'; c.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); }
            }
        }
    });
    G.tex(scene, 'bg_mars', 225, 73, (c, w, h) => {
        const r = G.rng(23);
        for (let y = 0; y < 38; y++) { const t = y / 38; c.fillStyle = `rgb(${196 + t * 40 | 0},${130 + t * 56 | 0},${100 + t * 42 | 0})`; c.fillRect(0, y, w, 1); }
        disc(c, 58, 12, 2, '#fff6dc'); disc(c, 58, 12, 4, 'rgba(255,246,220,0.25)');
        px(c, 160, 9, 2, 2, '#c9a58f'); // Phobos
        let hy = 33; for (let x = 0; x < w; x++) { hy += (r() - 0.5) * 1.4; hy = VB.clamp(hy, 29, 37); px(c, x, Math.round(hy), 1, 12, '#a4553d'); }
        for (let y = 38; y < h; y++) {
            const t = (y - 38) / 35;
            for (let x = 0; x < w; x++) {
                const n = (r() - 0.5) * 18; const ripple = Math.sin(x * 0.18 + y * 0.9) * 5;
                c.fillStyle = `rgb(${190 - t * 60 + n + ripple | 0},${92 - t * 36 + n * 0.6 + ripple * 0.6 | 0},${60 - t * 24 + n * 0.5 | 0})`; c.fillRect(x, y, 1, 1);
            }
        }
        for (let i = 0; i < 40; i++) px(c, r() * w | 0, 40 + r() * 32 | 0, 2, 1, '#6e2f22');
    });

    /* ---------- outpost structures ---------- */
    G.tex(scene, 'dome', 28, 16, (c) => {
        const inside = (x, y) => { const dx = (x + 0.5 - 14) / 14, dy = (y + 0.5 - 16) / 15.5; return dx * dx + dy * dy <= 1; };
        for (let y = 0; y < 16; y++) for (let x = 0; x < 28; x++) {
            if (!inside(x, y)) continue;
            const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1);
            let col = (x % 7 === 0) ? '#c3c8d8' : (x < 11 && y < 8 ? '#f6f8ff' : '#e2e6f2');
            if (x > 19) col = (x % 7 === 0) ? '#a9aec2' : '#c9cedd';
            if (edge) col = '#2a2a45';
            px(c, x, y, 1, 1, col);
        }
        px(c, 10, 8, 8, 4, '#2a2a45'); px(c, 11, 9, 6, 2, '#4ac3ff'); px(c, 11, 9, 2, 1, '#c8f3ff');
        px(c, 12, 12, 4, 4, '#2a2a45'); px(c, 13, 13, 2, 3, '#8f94a8'); px(c, 3, 15, 22, 1, '#8f94a8');
    });
    G.tex(scene, 'greenhouse', 24, 14, (c) => {
        const inside = (x, y) => { const dx = (x + 0.5 - 12) / 12, dy = (y + 0.5 - 14) / 13.5; return dx * dx + dy * dy <= 1; };
        for (let y = 0; y < 14; y++) for (let x = 0; x < 24; x++) {
            if (!inside(x, y)) continue;
            const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1);
            let col = (x % 5 === 2) ? '#2c8f4a' : '#8ff2b0';
            if (edge) col = '#1d5a33';
            px(c, x, y, 1, 1, col);
        }
        for (let x = 3; x < 21; x += 3) { px(c, x, 10, 2, 3, '#2fbf4f'); px(c, x, 9, 1, 1, '#ff5a5a'); }
        px(c, 2, 13, 20, 1, '#6b4426');
    });
    G.grid(scene, 'panel', [
        "..............", ".cccccccccccc.", ".cBbBBbBBbBBc.", ".cBbBBbBBbBBc.", ".cbbbbbbbbbbc.", ".cBbBBbBBbBBc.", ".cccccccccccc.", "......gg......", "......gg......", ".....gggg....."
    ], { c: '#cfd4e4', B: '#2f5fd0', b: '#6d95ff', g: '#8f94a8' });
    G.grid(scene, 'berm', ["...dddd...", ".ddlllldd.", "dllllllggd", "dllggllllg"], { d: '#555566', l: '#9a9aa8', g: '#7a7a88' });
    G.grid(scene, 'rover', [
        "......y.........", "......y..cccc...", "...dddddddddddd.", "..dwwwwwwwwwwwwd", "..dwooooooooowd.", "..dddddddddddd..", ".kkk..kkk..kkk..", "kkAkk.kkAkk.kkAk", ".kkk..kkk..kkk.."
    ], { y: '#cfd4e4', c: '#4ac3ff', d: '#2a2a45', w: '#e8e8f0', o: '#ff8a3d', k: '#1b1b2f', A: '#8f94a8' });
    G.grid(scene, 'flag', ["wwwwr", "wwwwr", "wwbbr", "wwwww", "g....", "g....", "g....", "g....", "g....", "g...."], { w: '#ffffff', r: '#e53030', b: '#2f5fd0', g: '#cfd4e4' });
    G.tex(scene, 'rock', 8, 5, (c) => { const r = G.rng(5); for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) { const dx = (x - 3.5) / 4, dy = (y - 4) / 4.2; if (dx * dx + dy * dy < 1) px(c, x, y, 1, 1, y < 2 ? '#b0b0be' : '#757585'); } });

    /* ---------- plants (garden mini-game) ---------- */
    for (let n = 0; n <= 4; n++) {
        G.tex(scene, 'plant' + n, 14, 14, (c) => {
            px(c, 2, 11, 10, 3, '#6b4426'); px(c, 3, 11, 8, 1, '#8a5a34'); px(c, 1, 12, 12, 2, '#9aa3b5');
            if (n >= 1) { px(c, 6, 8, 2, 3, '#2a8f38'); disc(c, 5, 8, 1, '#3fbf4a'); disc(c, 9, 8, 1, '#3fbf4a'); }
            if (n >= 2) { px(c, 6, 5, 2, 4, '#2a8f38'); disc(c, 4, 6, 2, '#3fbf4a'); disc(c, 10, 6, 2, '#3fbf4a'); }
            if (n >= 3) { disc(c, 7, 3, 3, '#3fbf4a'); disc(c, 3, 8, 2, '#2a8f38'); disc(c, 11, 8, 2, '#2a8f38'); }
            if (n >= 4) { disc(c, 4, 4, 1, '#ff4d4d'); disc(c, 10, 5, 1, '#ff4d4d'); disc(c, 7, 1, 1, '#ff4d4d'); }
        });
    }
    G.tex(scene, 'wilt', 14, 14, (c) => { px(c, 2, 11, 10, 3, '#6b4426'); px(c, 1, 12, 12, 2, '#9aa3b5'); px(c, 6, 8, 2, 3, '#7a6a2a'); px(c, 4, 7, 3, 1, '#9a8a3a'); px(c, 8, 8, 3, 1, '#9a8a3a'); });

    /* ---------- falling items (oxygen mini-game) ---------- */
    G.tex(scene, 'atom_o', 14, 14, (c) => { disc(c, 7, 7, 6, '#7a1020'); disc(c, 7, 7, 5, '#ff4d5e'); disc(c, 5, 5, 2, '#ffc0c8'); });
    G.tex(scene, 'atom_c', 14, 14, (c) => { disc(c, 7, 7, 6, '#12602c'); disc(c, 7, 7, 5, '#4cd37a'); disc(c, 5, 5, 2, '#c8ffd8'); px(c, 2, 7, 10, 1, '#12602c'); });
    G.tex(scene, 'ice', 14, 14, (c) => { for (let i = 0; i < 7; i++) { px(c, 7 - i, i, i * 2 + 1, 1, i < 2 ? '#e8ffff' : '#7fe3ff'); px(c, 7 - i, 13 - i, i * 2 + 1, 1, '#3aa8d8'); } px(c, 5, 4, 2, 2, '#ffffff'); });
    G.tex(scene, 'dust', 14, 14, (c) => { const r = G.rng(9); disc(c, 7, 7, 5, '#5a4636'); for (let i = 0; i < 8; i++) { const a = i * 0.785; px(c, 7 + Math.cos(a) * 6 | 0, 7 + Math.sin(a) * 6 | 0, 2, 2, '#3a2d22'); } px(c, 5, 5, 2, 2, '#9a826c'); });
    G.tex(scene, 'tank', 36, 22, (c) => {
        px(c, 0, 2, 36, 20, '#2a2a45'); px(c, 2, 0, 32, 4, '#2a2a45'); px(c, 2, 4, 32, 16, '#8f94a8'); px(c, 4, 4, 28, 3, '#cfd4e4');
        px(c, 4, 16, 28, 3, '#6a6f84'); px(c, 14, 9, 8, 5, '#58c8ff'); px(c, 15, 10, 3, 1, '#ffffff'); px(c, 3, 2, 30, 2, '#58c8ff');
    });
    G.tex(scene, 'dot', 4, 4, (c) => px(c, 0, 0, 4, 4, '#ffffff'));
    G.tex(scene, 'spark', 3, 3, (c) => { px(c, 1, 0, 1, 3, '#fff'); px(c, 0, 1, 3, 1, '#fff'); });
};
