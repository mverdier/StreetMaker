export interface TourStep {
    id: string;
    title: string;
    description: string;
    selector?: string | string[];
    dimmed?: boolean;
    onEnter?: () => void;
    advanceHint?: string;
    onNext?: () => void
}

export class GuidedTour {
    private steps: TourStep[];
    private currentIndex = 0;
    private isActive = false;
    private isAdvancing = false;

    private spotlightLayerEl: HTMLElement;
    private spotlightBoxes: HTMLElement[] = [];
    private cardEl: HTMLElement;
    private titleEl: HTMLElement;
    private bodyEl: HTMLElement;
    private progressEl: HTMLElement;
    private hintEl: HTMLElement;
    private prevBtn: HTMLButtonElement;
    private nextBtn: HTMLButtonElement;
    private closeBtn: HTMLButtonElement;

    private highlightedEls: {
        el: HTMLElement;
        prevPosition: string;
        prevZIndex: string;
    }[] = [];

    private onExitCallback?: () => void;
    private handleReposition = () => {
        if (this.isActive) {
            this.positionElements();
        }
    };

    constructor(steps: TourStep[], onExit?: () => void) {
        this.steps = steps;
        this.onExitCallback = onExit;

        this.spotlightLayerEl = document.createElement('div');
        this.spotlightLayerEl.id = 'guided-tour-spotlight-layer';
        this.spotlightLayerEl.className = 'tour-spotlight-layer hidden';
        document.body.appendChild(this.spotlightLayerEl);

        this.cardEl = document.createElement('div');
        this.cardEl.id = 'guided-tour-card';
        this.cardEl.className = 'tour-card hidden';
        this.cardEl.innerHTML = `
            <div class="tour-card-header">
                <span id="tour-progress" class="tour-progress"></span>
                <button id="tour-close-btn" type="button" class="tour-close-btn" title="Exit Tour">&times;</button>
            </div>
            <h3 id="tour-title" class="tour-title"></h3>
            <p id="tour-body" class="tour-body"></p>
            <p id="tour-hint" class="tour-hint"></p>
            <div class="tour-card-footer">
                <button id="tour-prev-btn" type="button" class="panel-cancel-button">Back</button>
                <button id="tour-next-btn" type="button" class="panel-confirm-button">Next</button>
            </div>
        `;

        document.body.appendChild(this.spotlightLayerEl);
        document.body.appendChild(this.cardEl);

        this.progressEl = this.cardEl.querySelector('#tour-progress') as HTMLElement;
        this.titleEl = this.cardEl.querySelector('#tour-title') as HTMLElement;
        this.bodyEl = this.cardEl.querySelector('#tour-body') as HTMLElement;
        this.hintEl = this.cardEl.querySelector('#tour-hint') as HTMLElement;
        this.prevBtn = this.cardEl.querySelector('#tour-prev-btn') as HTMLButtonElement;
        this.nextBtn = this.cardEl.querySelector('#tour-next-btn') as HTMLButtonElement;
        this.closeBtn = this.cardEl.querySelector('#tour-close-btn') as HTMLButtonElement;

        this.bindEvents();
    }

    private bindEvents(): void {
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        this.closeBtn.addEventListener('click', () => this.stop());
        window.addEventListener('resize', this.handleReposition);
    }

    public start(startIndex = 0): void {
        if (this.steps.length === 0) return;
        this.isActive = true;
        this.spotlightLayerEl.classList.remove('hidden');
        this.cardEl.classList.remove('hidden');
        this.goTo(startIndex);
    }

    public stop(): void {
        this.isActive = false;
        this.spotlightLayerEl.classList.add('hidden');
        this.cardEl.classList.add('hidden');
        this.onExitCallback?.();
    }

    public next(): void {
        if (!this.isActive || this.isAdvancing) return;
        this.isAdvancing = true;

        try {
            const currentStep = this.steps[this.currentIndex];
            currentStep?.onNext?.();

            if (this.currentIndex < this.steps.length - 1) {
                this.goTo(this.currentIndex + 1);
            } else {
                this.stop();
            }
        } finally {
            this.isAdvancing = false;
        }
    }

    public prev(): void {
        if (!this.isActive || this.currentIndex <= 0) return;
        this.goTo(this.currentIndex - 1);
    }

    public goTo(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        this.currentIndex = index;
        const step = this.steps[this.currentIndex];

        step.onEnter?.();

        this.progressEl.textContent = `Step ${this.currentIndex + 1} of ${this.steps.length}`;
        this.titleEl.textContent = step.title;
        this.bodyEl.textContent = step.description;
        this.hintEl.textContent = step.advanceHint ?? '';
        this.hintEl.style.display = step.advanceHint ? 'block' : 'none';

        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.textContent = this.currentIndex === this.steps.length - 1 ? 'Finish' : 'Next';

        requestAnimationFrame(() => this.positionElements());
    }

    public getCurrentStepId(): string | null {
        if (!this.isActive) return null;
        return this.steps[this.currentIndex]?.id ?? null;
    }

    public advanceFrom(expectedStepId: string): void {
        if (!this.isActive) return;
        if (this.getCurrentStepId() === expectedStepId) {
            this.next();
        }
    }

    private syncSpotlightBoxes(rects: DOMRect[], pad: number): void {
        while (this.spotlightBoxes.length < rects.length) {
            const box = document.createElement('div');
            box.className = 'tour-spotlight-box';
            this.spotlightLayerEl.appendChild(box);
            this.spotlightBoxes.push(box);
        }

        this.spotlightBoxes.forEach((box, idx) => {
            const rect = rects[idx];
            if (!rect) {
                box.style.display = 'none';
                return;
            }
            box.style.display = 'block';
            box.style.top = `${Math.max(0, rect.top - pad)}px`;
            box.style.left = `${Math.max(0, rect.left - pad)}px`;
            box.style.width = `${rect.width + pad * 2}px`;
            box.style.height = `${rect.height + pad * 2}px`;
        });
    }

    private positionElements(): void {
        const step = this.steps[this.currentIndex];
        const selectors = Array.isArray(step.selector)
            ? step.selector
            : step.selector
                ? [step.selector]
                : [];

        const matchedEls: HTMLElement[] = [];
        const rects: DOMRect[] = [];
        for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;
            matchedEls.push(el);
            rects.push(rect);
        }

        const shouldDim = step.dimmed !== false;
        this.applyHighlightedElements(shouldDim ? matchedEls : []);
        this.spotlightLayerEl.style.background = shouldDim ? 'rgba(0, 0, 0, 0.25)' : 'transparent';

        if (rects.length === 0) {
            this.syncSpotlightBoxes([], 6);
            this.cardEl.style.top = '24px';
            this.cardEl.style.right = '24px';
            this.cardEl.style.left = 'auto';
            this.cardEl.style.bottom = 'auto';
            return;
        }

        const pad = 6;
        this.updateBackdropCutouts(shouldDim ? rects : [], pad)
        this.syncSpotlightBoxes(rects, pad);

        const maxRight = Math.max(...rects.map((r) => r.right));
        const minTop = Math.min(...rects.map((r) => r.top));

        const cardWidth = 320;
        const spaceOnRight = window.innerWidth - (maxRight + pad + 16);
        if (spaceOnRight >= cardWidth) {
            this.cardEl.style.left = `${maxRight + pad + 16}px`;
            this.cardEl.style.top = `${Math.min(Math.max(16, minTop), window.innerHeight - 240)}px`;
            this.cardEl.style.right = 'auto';
        } else {
            this.cardEl.style.left = 'auto';
            this.cardEl.style.right = '16px';
            this.cardEl.style.top = '16px';
        }
    }

    private clearHighlightedElements(): void {
        for (const item of this.highlightedEls) {
            item.el.style.position = item.prevPosition;
            item.el.style.zIndex = item.prevZIndex;
        }
        this.highlightedEls = [];
    }

    private applyHighlightedElements(elements: HTMLElement[]): void {
        this.clearHighlightedElements();

        for (const el of elements) {
            const computedPos = window.getComputedStyle(el).position;
            this.highlightedEls.push({
                el,
                prevPosition: el.style.position,
                prevZIndex: el.style.zIndex,
            });

            if (computedPos === 'static') {
                el.style.position = 'relative';
            }
            el.style.zIndex = '9992';
        }
    }

    private updateBackdropCutouts(rects: DOMRect[], pad: number): void {
        if (rects.length === 0) {
            this.spotlightLayerEl.style.clipPath = '';
            return;
        }

        const w = window.innerWidth;
        const h = window.innerHeight;

        const points: string[] = [
            '0px 0px',
            `${w}px 0px`,
            `${w}px ${h}px`,
            `0px ${h}px`,
            '0px 0px',
        ];

        for (const r of rects) {
            const left = Math.max(0, Math.floor(r.left - pad));
            const top = Math.max(0, Math.floor(r.top - pad));
            const right = Math.min(w, Math.ceil(r.right + pad));
            const bottom = Math.min(h, Math.ceil(r.bottom + pad));

            if (right <= left || bottom <= top) continue;

            points.push(
                `${left}px ${top}px`,
                `${left}px ${top}px`,
                `${right}px ${top}px`,
                `${right}px ${bottom}px`,
                `${left}px ${bottom}px`,
                `${left}px ${top}px`,
                '0px 0px'
            );
        }

        this.spotlightLayerEl.style.clipPath = `polygon(evenodd, ${points.join(', ')})`;
    }
}