import { Map } from 'maplibre-gl';

export function registerMapIcons(map: Map): void {
    // Triangle marking pattern image
    const canvas = document.createElement('canvas');
    canvas.width = 34;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, 34, 32);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(17, 2);
        ctx.lineTo(29, 30);
        ctx.lineTo(5, 30);
        ctx.closePath();
        ctx.fill();
        map.addImage('triangle-markings-pattern', ctx.getImageData(0, 0, 34, 32), { pixelRatio: 2 });
    }

    // Road arrows
    const createArrowImage = (type: 'forward' | 'left' | 'right') => {
        const arrowCanvas = document.createElement('canvas');
        arrowCanvas.width = 64;
        arrowCanvas.height = 64;
        const actx = arrowCanvas.getContext('2d');
        if (actx) {
            actx.clearRect(0, 0, 64, 64);
            actx.fillStyle = '#ffffff';
            actx.beginPath();

            if (type === 'forward') {
                actx.moveTo(32, 6);
                actx.lineTo(12, 26);
                actx.lineTo(24, 23);
                actx.lineTo(24, 58);
                actx.lineTo(40, 58);
                actx.lineTo(40, 23);
                actx.lineTo(52, 26);
            } else if (type === 'left') {
                actx.moveTo(8, 32);
                actx.lineTo(26, 16);
                actx.lineTo(22, 24);
                actx.lineTo(46, 24);
                actx.bezierCurveTo(54, 24, 54, 32, 54, 40);
                actx.lineTo(54, 58);
                actx.lineTo(38, 58);
                actx.lineTo(38, 40);
                actx.bezierCurveTo(38, 38, 38, 38, 34, 38)
                actx.lineTo(22, 38);
                actx.lineTo(26, 48);
            } else if (type === 'right') {
                actx.moveTo(56, 32);
                actx.lineTo(38, 16);
                actx.lineTo(42, 24);
                actx.lineTo(18, 24);
                actx.bezierCurveTo(10, 24, 10, 32, 10, 40);
                actx.lineTo(10, 58);
                actx.lineTo(26, 58);
                actx.lineTo(26, 40);
                actx.bezierCurveTo(26, 38, 26, 38, 30, 38);
                actx.lineTo(42, 38);
                actx.lineTo(38, 48);
            }

            actx.closePath();
            actx.fill();
            map.addImage(`arrow-${type}-icon`, actx.getImageData(0, 0, 64, 64), { pixelRatio: 2, sdf: true });
        }
    };

    createArrowImage('forward');
    createArrowImage('left');
    createArrowImage('right');
}