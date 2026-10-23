declare module '*?worker&url' {
    const src: string;
    export default src;
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

import 'maplibre-gl';

declare module 'maplibre-gl' {
    interface MapEventType {
        'draw.create': any;
        'draw.update': any;
        'draw.delete': any;
        'draw.selectionchange': any;
        'draw.modechange': any;
        'draw.render': any;
        'draw.actionable': any;
    }
}