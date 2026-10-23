export class WelcomeModal {
    private overlay: HTMLElement;

    constructor() {
        this.overlay = document.getElementById('welcome-modal-overlay') as HTMLElement;
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
    }

    public open(): void {
        this.overlay?.classList.remove('hidden');
    }

    public close(): void {
        this.overlay?.classList.add('hidden');
    }
}