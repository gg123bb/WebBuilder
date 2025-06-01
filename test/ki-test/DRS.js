// drs_autonomous.module.js – mit Trackpoint-Aktionslogik & Smart-Aktivierer

export class DRS {
    constructor(element, options = {}) {
        this.element = element;
        this.options = Object.assign({
            drag: true,
            resize: true,
            clipping: true,
            resizing: true,
            snapEdge: 10,
            trackpoint: false,
            trackpointReset: false,
            resizeMargin: 5,
            useTrackpointTrigger: false
        }, options);

        this.state = {
            isDragging: false,
            isResizing: false,
            clicked: null,
            start: {},
            snapTarget: null,
            snapSide: null,
            countdownTimer: null,
            countdownField: null
        };

        this.init();
    }

    init() {
        this.setupStyles();
        this.setupListeners();
        this.createGhostpane();
        this.createLoadingCircle();
        if (this.options.trackpoint) this.createTrackpoint();
    }

    setupStyles() {
        const el = this.element;
        el.style.position = 'absolute';
        el.style.boxSizing = 'border-box';
        el.classList.add('DRS');
    }

    setupListeners() {
        this.element.addEventListener('mousedown', (e) => this.onDown(e));
        document.addEventListener('mousemove', (e) => this.onMove(e));
        document.addEventListener('mouseup', (e) => this.onUp(e));
    }

    createGhostpane() {
        if (document.getElementById('ghostpane')) return;
        const ghost = document.createElement('div');
        ghost.id = 'ghostpane';
        ghost.className = 'ghostpane';
        Object.assign(ghost.style, {
            position: 'absolute',
            border: '2px dashed var(--ghost-border, #007bff)',
            backgroundColor: 'var(--ghost-bg, rgba(0, 123, 255, 0.1))',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
            zIndex: 1002
        });
        document.body.appendChild(ghost);
        this.ghostpane = ghost;
    }

    createLoadingCircle() {
        if (document.getElementById('loadingCircle')) return;
        const circle = document.createElement('div');
        circle.id = 'loadingCircle';
        Object.assign(circle.style, {
            position: 'absolute',
            width: '20px',
            height: '20px',
            border: '2px solid transparent',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            animation: '',
            display: 'none',
            zIndex: 1003
        });
        document.body.appendChild(circle);
        this.loadingCircle = circle;
    }

    updateGhostpane(field) {
        const gp = this.ghostpane;
        const rect = field.getBoundingClientRect();
        gp.style.left = rect.left + 'px';
        gp.style.top = rect.top + 'px';
        gp.style.width = rect.width + 'px';
        gp.style.height = rect.height + 'px';
        gp.style.opacity = 1;
    }

    showLoadingCountdown(field, durationMs) {
        const rect = field.getBoundingClientRect();
        const circle = this.loadingCircle;
        circle.style.left = (rect.left + rect.width / 2 - 10) + 'px';
        circle.style.top = (rect.top + rect.height / 2 - 10) + 'px';
        circle.style.display = 'block';
        circle.style.animation = `spin ${durationMs / 1000}s linear infinite`;

        clearTimeout(this.state.countdownTimer);
        this.state.countdownField = field;
        this.state.countdownTimer = setTimeout(() => {
            field.dataset.ready = 'true';
            circle.style.display = 'none';
            this.dispatch('drs:countdown:complete', { field });
        }, durationMs);
    }

    hideGhostpane() {
        if (this.ghostpane) this.ghostpane.style.opacity = 0;
        if (this.loadingCircle) this.loadingCircle.style.display = 'none';
        clearTimeout(this.state.countdownTimer);
        this.state.countdownField = null;
    }

    checkActionFieldOverlap(e) {
        const pointerX = e.clientX;
        const pointerY = e.clientY;
        let match = null;

        const elRect = this.element.getBoundingClientRect();
        const elArea = elRect.width * elRect.height;

        const tp = this.element.querySelector('.trackpoint');
        const tpRect = tp?.getBoundingClientRect();

        document.querySelectorAll('.aktionfield').forEach(field => {
            const rect = field.getBoundingClientRect();

            let overlapArea = this.getIntersectionArea(elRect, rect);
            const overlapRatio = overlapArea / elArea;

            const mouseInside =
                pointerX >= rect.left && pointerX <= rect.right &&
                pointerY >= rect.top && pointerY <= rect.bottom;

            const trackpointInside = tpRect &&
                tpRect.left >= rect.left && tpRect.right <= rect.right &&
                tpRect.top >= rect.top && tpRect.bottom <= rect.bottom;

            const requiresTP = this.options.useTrackpointTrigger;

            if (
                (!requiresTP && (mouseInside || overlapRatio > 0.4)) ||
                (requiresTP && trackpointInside)
            ) {
                match = field;
            }
        });

        return match;
    }

    getIntersectionArea(r1, r2) {
        const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
        return xOverlap * yOverlap;
    }

    // ... (restlicher Code unverändert)
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.DRS').forEach(el => {
        const options = {
            drag: el.dataset.drag !== 'false',
            resize: el.dataset.resize !== 'false',
            clipping: el.dataset.clipping === 'true',
            trackpoint: el.dataset.trackpoint === 'true',
            trackpointReset: el.dataset.trackpointReset === 'true',
            useTrackpointTrigger: el.dataset.useTrackpointTrigger === 'true'
        };
        new DRS(el, options);
    });
});
