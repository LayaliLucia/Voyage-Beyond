VB.EndingScene = class extends Phaser.Scene {
    constructor() { super('Ending'); }
    create(data) {
        this.cameras.main.fadeIn(400, 0, 0, 0);
        const S = VB.S, over = data && data.over;
        VB.ui.space(this, true); VB.audio.setMood('menu');
        if (over) {
            VB.audio.lose();
            VB.ui.text(this, 450, 50, 'MISSION ABORTED', 44, '#ff7a7a', { ox: 0.5, stroke: '#000', st: 8 });
            const why = over === 'dose' ? 'The crew took too much radiation (over 100 mSv). Next time build a bigger SHIELD and use your storm game (STORM WATCH or SIREN WATCH) when a solar storm alert appears.'
                                        : 'The crew\'s health dropped to zero. Keep OXYGEN, POWER and FOOD above zero every sol, and rest with CREW CHAT.';
            VB.ui.text(this, 450, 130, why, 18, '#ffffff', { ox: 0.5, w: 700, align: 'center', ls: 8 });
            VB.ui.text(this, 450, 240, 'You reached ' + VB.CHAPTERS[S.chapter].world + ', sol ' + S.sol + '. Real astronauts train for years to learn these lessons!', 15, '#a9a7d8', { ox: 0.5, w: 700, align: 'center' });
        } else {
            VB.audio.win();
            const n = VB.rank();
            VB.ui.text(this, 450, 36, 'VOYAGE COMPLETE!', 46, '#ffd23f', { ox: 0.5, stroke: '#2a1a7a', st: 8 });
            VB.ui.stars(this, 450, 118, n, 3, 6);
            VB.ui.text(this, 450, 160, 'You kept the crew alive on the Moon AND on Mars, ' + S.name + '!', 18, '#ffffff', { ox: 0.5, w: 760, align: 'center' });
            VB.ui.text(this, 450, 200, 'Health ' + Math.round(S.health) + '%   |   Radiation dose ' + Math.round(S.dose) + ' of 100 mSv   |   Storms handled ' + S.log.stormsHandled + '/' + S.log.storms, 15, '#6fe06f', { ox: 0.5 });
            const g = this.add.graphics(); VB.ui.box(g, 90, 236, 720, 150, 0x0d0c22, 0x3a37a8);
            VB.ui.text(this, 106, 244, 'WHAT YOU LEARNED FROM REAL NASA DATA', 14, '#58c8ff');
            VB.ui.text(this, 106, 268,
                '- DONKI: CME speed and distance tell us when a solar storm arrives.\n' +
                '- OSDR: astronauts grow plants in space with red and blue LEDs.\n' +
                '- RadLab: water and plastic block cosmic rays better than metal.\n' +
                '- Mars Trek: landing sites trade water, safety, shielding and sun.\n' +
                '- Moon surface: ~1.37 mSv/day.  Mars surface: ~0.67 mSv/day.', 14, '#ffffff', { w: 690, ls: 7 });
        }
        VB.ui.button(this, 300, 440, 280, 46, 'PLAY AGAIN', () => { VB.newGame(S.role, S.name); VB.rollAlert(); VB.go(this, 'Outpost', { intro: true }); }, { size: 18, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 });
        VB.ui.button(this, 600, 440, 280, 46, 'MAIN MENU', () => VB.go(this, 'Title'), { size: 18 });
    }
};
