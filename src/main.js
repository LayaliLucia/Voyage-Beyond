(function () {
    const config = {
        type: Phaser.AUTO,
        parent: 'game',
        width: VB.W, height: VB.H,
        backgroundColor: '#05040f',
        pixelArt: true,
        dom: { createContainer: true },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [VB.BootScene, VB.TitleScene, VB.IntroScene, VB.OutpostScene, VB.GardenScene, VB.SolarScene,
                VB.OxygenScene, VB.ShieldScene, VB.StormScene, VB.LandingScene, VB.EndingScene,
                VB.MarsOxygenScene, VB.MarsSolarScene, VB.MarsGardenScene, VB.MarsShieldScene, VB.MarsStormScene]
    };
    window.addEventListener('load', () => { window.VBGame = new Phaser.Game(config); });
})();
