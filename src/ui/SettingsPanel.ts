export interface SettingsPanelCallbacks {
    onClose: () => void;
    onToggleLabels: (enabled: boolean) => void;
}

export class SettingsPanel {
    private panelEl: HTMLElement | null;

    constructor(callbacks: SettingsPanelCallbacks) {
        this.panelEl = document.getElementById('settings-panel');

        this.isolateEvents();
        this.bindEvents(callbacks);
    }

    private isolateEvents(): void {
        if (!this.panelEl) return;
        ['keydown', 'keyup', 'keypress'].forEach((eventType) => {
            this.panelEl?.addEventListener(eventType, (e) => e.stopPropagation());
        });
    }

    public toggle(): void {
        if (!this.panelEl) return;
        const isVisible = this.panelEl.style.display === 'block';
        this.panelEl.style.display = isVisible ? 'none' : 'block';
    }

    public close(): void {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }

    private bindEvents(callbacks: SettingsPanelCallbacks): void {
        const btnClose = document.getElementById('settings-btn-close');
        btnClose?.addEventListener('click', () => callbacks.onClose());

        const toggleLabelsEl = document.getElementById('toggle-labels') as HTMLInputElement;
        toggleLabelsEl?.addEventListener('change', (e) => {
            callbacks.onToggleLabels((e.target as HTMLInputElement).checked);
        });
    }
}