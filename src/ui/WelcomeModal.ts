export interface WelcomeModalOptions {
    onStartTour?: () => void;
}

export class WelcomeModal {
    private overlay: HTMLElement;
    private onStartTour?: () => void;

    constructor(options?: WelcomeModalOptions) {
        this.overlay = document.getElementById('welcome-modal-overlay') as HTMLElement;
        this.onStartTour = options?.onStartTour;
        this.initListeners();
    }

    private initListeners(): void {
        const closeBtn = document.getElementById('welcome-close-btn');
        closeBtn?.addEventListener('click', () => this.close());

        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('hidden')) {
                this.close();
            }
        });

        const tourBtn = document.getElementById('welcome-tour-btn');
        tourBtn?.addEventListener('click', () => {
            this.close();
            this.onStartTour?.();
        });
    }

    public open(): void {
        this.overlay?.classList.remove('hidden');
    }

    public close(): void {
        this.overlay?.classList.add('hidden');
    }
}