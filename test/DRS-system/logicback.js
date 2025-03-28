var core = core || {};
core.util = core.util || {};
core.util.DRS = function() {
    var makeDRS = function(pane, handle, options) {
        "use strict";
        options = options || {};
        var minWidth = 60;
        var minHeight = 40;
        var SNAP_MARGINS = options.snapEdge || 10;
        var RESIZE_MARGIN_INNER = options.resizeInnerM || 5;
        var RESIZE_MARGIN_OUTER = options.resizeOuterM || 5;
        var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;
        var e, b, x, y, inLR, inTB;
        var clicked = null;
        var redraw = false;
        var _usePercent = false;
        var ghostpane = document.createElement('div');
        let isOverActionField = false;
        let isCountdownComplete = false;
        ghostpane.id = "DRSghost";
        ghostpane.style.opacity = 0;
        ghostpane.style.backgroundColor = "var(--preview-default-color, rgba(0,0,0,0.5))";
        ghostpane.style.pointerEvents = "none";
        ghostpane.style.position = "absolute";
        ghostpane.style.zIndex = 1002;  // Ensure it's in front of the dragged element

        function clipElements(element, others) {
            const CLIP_THRESHOLD = 15;
            const elementRect = element.getBoundingClientRect();
            let didClip = false;

            others.forEach(other => {
                if (other === element) return;
                const otherRect = other.getBoundingClientRect();

                // Horizontal clipping
                if (Math.abs(elementRect.right - otherRect.left) < CLIP_THRESHOLD) {
                    element.style.left = (otherRect.left - elementRect.width) + 'px';
                    showGuideline(guidelines.vertical, otherRect.left);
                    didClip = true;
                }
                if (Math.abs(elementRect.left - otherRect.right) < CLIP_THRESHOLD) {
                    element.style.left = otherRect.right + 'px';
                    showGuideline(guidelines.vertical, otherRect.right);
                    didClip = true;
                }

                // Vertical clipping
                if (Math.abs(elementRect.bottom - otherRect.top) < CLIP_THRESHOLD) {
                    element.style.top = (otherRect.top - elementRect.height) + 'px';
                    showGuideline(guidelines.horizontal, otherRect.top);
                    didClip = true;
                }
                if (Math.abs(elementRect.top - otherRect.bottom) < CLIP_THRESHOLD) {
                    element.style.top = otherRect.bottom + 'px';
                    showGuideline(guidelines.horizontal, otherRect.bottom);
                    didClip = true;
                }
            });
            return didClip;
        }

        function handleSnap(element) {
            const draggables = document.querySelectorAll('.draggable');
            const rect1 = element.getBoundingClientRect();
            const GRID_SIZE = 10;
            const SNAP_THRESHOLD = 20;

            // Grid snapping
            const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

            // Get element center point
            const centerX = rect1.left + rect1.width / 2;
            const centerY = rect1.top + rect1.height / 2;

            draggables.forEach(other => {
                if (other === element) return;
                const rect2 = other.getBoundingClientRect();

                // Smart edge detection
                const edges = {
                    left: Math.abs(rect1.left - rect2.left),
                    right: Math.abs(rect1.right - rect2.right),
                    top: Math.abs(rect1.top - rect2.top),
                    bottom: Math.abs(rect1.bottom - rect2.bottom)
                };

                // Apply snapping with momentum
                Object.entries(edges).forEach(([edge, distance]) => {
                    if (distance < SNAP_THRESHOLD) {
                        switch(edge) {
                            case 'left':
                                element.style.left = `${snapToGrid(rect2.left)}px`;
                                break;
                            case 'right':
                                element.style.left = `${snapToGrid(rect2.right - rect1.width)}px`;
                                break;
                            case 'top':
                                element.style.top = `${snapToGrid(rect2.top)}px`;
                                break;
                            case 'bottom':
                                element.style.top = `${snapToGrid(rect2.bottom - rect1.height)}px`;
                                break;
                        }
                    }
                });
            });

            // Force position update
            element.style.transform = 'translate(0,0)';
            return true;
        }

        const guidelines = createSnapGuidelines();

        function createSnapGuidelines() {
            const guidelines = {
                horizontal: document.createElement('div'),
                vertical: document.createElement('div')
            };

            guidelines.horizontal.className = 'snap-guideline horizontal';
            guidelines.vertical.className = 'snap-guideline vertical';

            guidelines.horizontal.style.cssText = `
                position: fixed;
                height: 1px;
                width: 100%;
                background: #00ff00;
                pointer-events: none;
                display: none;
                z-index: 9999;
            `;

            guidelines.vertical.style.cssText = `
                position: fixed;
                width: 1px;
                height: 100%;
                background: #00ff00;
                pointer-events: none;
                display: none;
                z-index: 9999;
            `;

            document.body.appendChild(guidelines.horizontal);
            document.body.appendChild(guidelines.vertical);

            return guidelines;
        }

        function showGuideline(guideline, position) {
            guideline.style.display = 'block';
            if (guideline.className.includes('vertical')) {
                guideline.style.left = `${position}px`;
            } else {
                guideline.style.top = `${position}px`;
            }

            // Auto-hide guidelines after 1.5 seconds
            setTimeout(() => {
                guideline.style.display = 'none';
            }, 1500);
        }

        function hideGuidelines(guidelines) {
            guidelines.horizontal.style.display = 'none';
            guidelines.vertical.style.display = 'none';
        }

        const COUNTDOWN_COMPLETE_BEHAVIORS = {
            HIDE: 'hide',
            SHOW_FULL: 'showFull',
            CUSTOM: 'custom'
        };

        // Hier loading anzeigen einstellung bearbeiten:
        let currentBehavior = COUNTDOWN_COMPLETE_BEHAVIORS.SHOW_FULL;
        /*
            Debug: Optionen:
            HIDE: 'hide',
            SHOW_FULL: 'showFull',
            CUSTOM: 'custom'
        */

        document.body.appendChild(ghostpane);
        let loadingCircle = document.createElement('div');
        loadingCircle.style.cssText = `
            position: fixed;
            width: 30px;
            height: 30px;
            border: 2px solid transparent;
            border-top: 2px solid var(--default-loading-circle-animation-color, #3498db);
            border-radius: 50%;
            pointer-events: none;
            display: none;
            z-index: 9999;
            animation: spin 2s linear infinite;
        `;
        document.body.appendChild(loadingCircle);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .loading-circle-complete {
                border: 2px solid var(--default-loading-circle-complete-color, #2ecc71) !important;
                border-radius: 50% !important;
            }`;
        document.head.appendChild(style);

        pane.style.boxSizing = "border-box";

        var handles = handle instanceof Array ? handle : [handle];
        var onHTMLhandle;

        function createHandleObjects() {
            b = b || pane.getBoundingClientRect();
            if (!hasHTMLElement(handles))
                handles = handles.concat([].slice.call(pane.getElementsByClassName('drag-area')));
            for (var i in handles) {
                if (handles[i] instanceof HTMLElement) {
                    bindEvents(handles[i], 'mousedown touchstart', handleDown);
                    bindEvents(handles[i], 'mouseup touchend', handleUp);
                    handles[i] = {ele: handles[i], type: 'html'};
                } else if (handles[i] instanceof Object) {
                    handles[i] = {type:'custom', coords:handles[i]};
                    drawDragHandle(handles[i]);
                } else {
                    handles[i] = {type:handles[i]};
                    drawDragHandle(handles[i]);
                }
            }
        }

        window.addEventListener('load', function() {
            createHandleObjects();
        });

        function handleDown() { onHTMLhandle = true; }
        function handleUp() { onHTMLhandle = false; }

        function setBounds(element, x, y, w, h) {
            if (x === undefined) {
                b = b || pane.getBoundingClientRect();
                x = b.left;
                y = b.top;
                w = b.width;
                h = b.height;
            }
            var wh = convertUnits(w, h);
            element.style.left = x + 'px';
            element.style.top = y + 'px';
            element.style.width = wh[0];
            element.style.height = wh[1];
        }

        function getBounds() {
            return [b.left, b.top, b.width, b.height];
        }

        function convertUnits(w, h) {
            if (!_usePercent) return [w + 'px', h + 'px'];
            var pH, pW;
            var docWidth = document.documentElement.clientWidth || document.body.clientWidth;
            pH = h / window.innerHeight * 100;
            pW = w / docWidth * 100;
            return [pW + '%', pH + '%'];
        }

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchstart', onTouchDown);
        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onTouchEnd);

        function onTouchDown(e) { onDown(e.touches[0]); }

        function onTouchMove(e) {
            onMove(e.touches[0]);
            if (clicked && (clicked.isMoving || clicked.isResizing)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }

        function onTouchEnd(e) {
            if (e.touches.length == 0) onUp(e.changedTouches[0]);
        }

        function onMouseDown(e) { onDown(e); }

        function onDown(e) {
            calc(e);
            var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;
            var isMoving = !isResizing && canMove();

            clicked = {
                x: x,
                y: y,
                cx: e.clientX,
                cy: e.clientY,
                w: b.width,
                h: b.height,
                isResizing: isResizing,
                isMoving: isMoving,
                onTopEdge: onTopEdge,
                onLeftEdge: onLeftEdge,
                onRightEdge: onRightEdge,
                onBottomEdge: onBottomEdge
            };

            // Element in den Vordergrund bringen
            if (isMoving || isResizing) {
                const allDraggables = document.querySelectorAll('.draggable');
                allDraggables.forEach(d => d.style.zIndex = "1");
                pane.style.zIndex = "1000";

                // Verhindern, dass das Event an andere Elemente weitergegeben wird
                e.stopPropagation();
            }
        }

        function canMove() {
            for (var i in handles) {
                var h = drawDragHandle(handles[i]);
                var c = h.coords;
                var r = {};
                var yb = b.height - y;
                var xr = b.width - x;
                if (c.bottom !== null && c.bottom !== undefined)
                    r.bottom = yb < c.height || (!c.height && y > c.top) && yb > c.bottom && inLR;
                if (c.top !== null && c.top !== undefined)
                    r.top = y < c.height || (!c.height && yb > c.bottom) && y > c.top && inLR;
                if (c.right !== null && c.right !== undefined)
                    r.right = xr < c.width || (!c.width && x > c.left ) && xr > c.right && inTB;
                if (c.left !== null && c.left !== undefined)
                    r.left = x < c.width || (!c.width && xr > c.right ) && x > c.left && inTB;
                var result = ((r.bottom || r.top) && r.left && r.right) ||
                    ((r.left || r.right) && r.bottom && r.top);
                if (c.invert && !result || onHTMLhandle) return true;
                else if(result || onHTMLhandle) return true;
            }
            return false;
        }

        function drawDragHandle(h) {
            var c = getHandleCoords(h);
            if (h.type == 'html') return h;
            if (h.coords && h.coords.hide) return h;
            if (!h.drawn) {
                var e = document.createElement('div');
                e.className = 'drag-area';
                e.style.position = "absolute";
                e.style.pointerEvents = "all";
                e.style.overflow = "hidden";
                pane.appendChild(e);
                h.drawn = true;
                h.ele = e;
            }
            if (c.bottom !== null) h.ele.style.bottom = c.bottom + "px";
            if (c.right !== null) h.ele.style.right = c.right + "px";
            if (c.top !== null) h.ele.style.top = c.top + "px";
            if (c.left !== null) h.ele.style.left = c.left + "px";
            if (c.height !== null) h.ele.style.height = c.height + "px";
            if (c.width !== null) h.ele.style.width = c.width + "px";
            return h;
        }

        function getHandleCoords(h) {
            var DO = 30;
            var types = {
                top: {top: 0, bottom: null, left: 0, right: 0, width: null, height: DO, invert: false},
                bottom: {top: null, bottom: 0, left: 0, right: 0, width: null, height: DO, invert: false},
                left: {top: 0, bottom: 0, left: 0, right: null, width: DO, height: null, invert: false},
                right: {top: 0, bottom: 0, left: null, right: 0, width: DO, height: null, invert: false},
                full: {top: 0, bottom: 0, left: 0, right: 0, width: null, height: null, invert: false},
                none: {top: null, bottom: null, left: null, right: null, width: null, height: null, invert: false}
            };
            if (h.type instanceof Array)
                h.coords = h.type;
            else if (h.type == 'html')
                h.coords = h.ele.getBoundingClientRect();
            else if (!h.type)
                h.type = 'full';

            if (!h.coords) {
                h.coords = types[h.type.split(' ')[0]];
                h.coords.invert = h.type.indexOf('invert') + 1;
                h.coords.hide = h.type.indexOf('hide') + 1;
            }
            return h.coords;
        }

        function calc(e) {
            b = pane.getBoundingClientRect();
            x = e.clientX - b.left;
            y = e.clientY - b.top;

            // define inner and outer margins
            var dMi = RESIZE_MARGIN_INNER;
            var dMo = -RESIZE_MARGIN_OUTER;
            var rMi = b.width - RESIZE_MARGIN_INNER;
            var rMo = b.width + RESIZE_MARGIN_OUTER;
            var bMi = b.height - RESIZE_MARGIN_INNER;
            var bMo = b.height + RESIZE_MARGIN_OUTER;
            inLR = x > dMo && x < rMo;
            inTB = y > dMo && y < bMo;

            onTopEdge = y <= dMi && y > dMo && inLR;
            onLeftEdge = x <= dMi && x > dMo && inTB;
            onBottomEdge = y >= bMi && y < bMo && inLR;
            onRightEdge = x >= rMi && x < rMo && inTB;
        }

        function handleCountdownComplete(field) {
            field.dataset.ready = "true";
            isCountdownComplete = true;

            switch(currentBehavior) {
                case COUNTDOWN_COMPLETE_BEHAVIORS.HIDE:
                    loadingCircle.style.display = 'none';
                    break;

                case COUNTDOWN_COMPLETE_BEHAVIORS.SHOW_FULL:
                    loadingCircle.style.animation = 'none';
                    loadingCircle.style.border = '2px solid var(--default-loading-circle-color, #3498db)';
                    loadingCircle.style.borderRadius = '50%';
                    break;

                case COUNTDOWN_COMPLETE_BEHAVIORS.CUSTOM:
                    loadingCircle.classList.add('loading-circle-complete');
                    break;
            }
        }

        function onMove(ee) {
            calc(ee);
            e = ee;
            redraw = true;

            // Wenn nicht geklickt, nur Cursor-Stil aktualisieren
            if (!clicked) {
                var db = document.documentElement || document.body;
                if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
                    db.style.cursor = 'nwse-resize';
                } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
                    db.style.cursor = 'nesw-resize';
                } else if (onRightEdge || onLeftEdge) {
                    db.style.cursor = 'ew-resize';
                } else if (onBottomEdge || onTopEdge) {
                    db.style.cursor = 'ns-resize';
                } else if (canMove()) {
                    db.style.cursor = 'move';
                } else {
                    db.style.cursor = 'default';
                }
                return;
            }

            // Größenänderung
            if (clicked && clicked.isResizing) {
                if (clicked.onRightEdge) {
                    pane.style.width = Math.max(x, minWidth) + "px";
                }
                if (clicked.onBottomEdge) {
                    pane.style.height = Math.max(y, minHeight) + "px";
                }
                if (clicked.onLeftEdge) {
                    var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
                    if (currentWidth > minWidth) {
                        pane.style.width = currentWidth + "px";
                        pane.style.left = e.clientX + "px";
                    }
                }
                if (clicked.onTopEdge) {
                    var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, minHeight);
                    if (currentHeight > minHeight) {
                        pane.style.height = currentHeight + "px";
                        pane.style.top = e.clientY + "px";
                    }
                }
                return;
            }

            // Bewegung
            if (clicked && clicked.isMoving) {
                // Grundlegende Bewegung
                pane.style.left = (e.clientX - clicked.x) + 'px';
                pane.style.top = (e.clientY - clicked.y) + 'px';

                // Clipping-Logik
                const nearbyElements = Array.from(document.querySelectorAll('.draggable')).filter(el => el !== pane);
                clipElements(pane, nearbyElements);

                // Ladekreis-Position aktualisieren
                loadingCircle.style.left = (ee.clientX - 17) + 'px';
                loadingCircle.style.top = (ee.clientY - 15) + 'px';

                isOverActionField = false;
                const aktionfields = document.querySelectorAll('.aktionfield');

                aktionfields.forEach(field => {
                    const fieldRect = field.getBoundingClientRect();
                    const elementRect = pane.getBoundingClientRect();
                    const centerX = elementRect.left + elementRect.width / 2;
                    const centerY = elementRect.top + elementRect.height / 2;

                    if (centerX > fieldRect.left && centerX < fieldRect.right &&
                        centerY > fieldRect.top && centerY < fieldRect.bottom) {
                        isOverActionField = true;

                        if (!field.countdownStarted) {
                            loadingCircle.style.animation = '';
                            loadingCircle.style.border = '2px solid transparent';
                            loadingCircle.style.borderTop = '2px solid var(--default-loading-circle-animation-color, #3498db)';
                            loadingCircle.classList.remove('loading-circle-complete');
                            isCountdownComplete = false;
                        }

                        if (field.dataset.type === "preview") {
                            if (field.dataset.widthaktion) {
                                ghostpane.style.width = field.dataset.widthaktion.includes('%') ||
                                field.dataset.widthaktion.includes('vw') ?
                                    field.dataset.widthaktion :
                                    field.dataset.widthaktion + '%';
                            }

                            if (field.dataset.heightaktion) {
                                ghostpane.style.height = field.dataset.heightaktion.includes('%') ||
                                field.dataset.heightaktion.includes('vh') ?
                                    field.dataset.heightaktion :
                                    field.dataset.heightaktion + '%';
                            }

                            if (field.dataset.positionaktion) {
                                const positions = field.dataset.positionaktion.split(';');
                                positions.forEach(position => {
                                    const [prop, value] = position.split(':');
                                    if (prop && value) {
                                        ghostpane.style[prop.trim()] = value.trim();
                                    }
                                });
                            }

                            ghostpane.style.opacity = 0.5;
                            ghostpane.style.zIndex = 1002;
                        }

                        const countdownValue = parseInt(field.dataset.couldown);
                        if (countdownValue >= 0) {
                            if (!field.countdownStarted) {
                                field.countdownStarted = true;
                                field.countdownTime = countdownValue;

                                const secondsValue = countdownValue / 1000;
                                loadingCircle.style.animation = `spin ${secondsValue}s linear`;

                                field.countdownTimer = setTimeout(() => {
                                    handleCountdownComplete(field);
                                }, countdownValue);
                            }
                            loadingCircle.style.display = 'block';
                        }
                    } else {
                        if (field.countdownStarted) {
                            clearTimeout(field.countdownTimer);
                            field.countdownStarted = false;
                            delete field.dataset.ready;
                        }
                    }
                });

                if (!isOverActionField) {
                    ghostpane.style.opacity = 0;
                    loadingCircle.style.display = 'none';
                }
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            if (!redraw) return;
            redraw = false;

            // Die meiste Arbeit wird in onMove erledigt, daher ist hier nicht viel zu tun
        }

// Animation starten
        animate();

        function onUp(e) {
            calc(e);

            // Cursor zurücksetzen
            document.documentElement.style.cursor = 'default';
            document.body.style.cursor = 'default';

            loadingCircle.style.display = 'none';
            isCountdownComplete = false;

            if (clicked && clicked.isMoving) {
                // Snapping beim Loslassen anwenden
                handleSnap(pane);

                const aktionfields = document.querySelectorAll('.aktionfield');
                aktionfields.forEach(field => {
                    const fieldRect = field.getBoundingClientRect();
                    const elementRect = pane.getBoundingClientRect();
                    const centerX = elementRect.left + elementRect.width / 2;
                    const centerY = elementRect.top + elementRect.height / 2;

                    if (centerX > fieldRect.left && centerX < fieldRect.right &&
                        centerY > fieldRect.top && centerY < fieldRect.bottom) {

                        // Änderungen nur anwenden, wenn Countdown abgeschlossen oder kein Countdown gesetzt ist
                        if (!field.dataset.couldown || field.dataset.ready === "true") {
                            if (field.dataset.widthaktion) {
                                pane.style.width = field.dataset.widthaktion.includes('%') ||
                                field.dataset.widthaktion.includes('vw') ?
                                    field.dataset.widthaktion :
                                    field.dataset.widthaktion + '%';
                            }
                            if (field.dataset.heightaktion) {
                                pane.style.height = field.dataset.heightaktion.includes('%') ||
                                field.dataset.heightaktion.includes('vh') ?
                                    field.dataset.heightaktion :
                                    field.dataset.heightaktion + '%';
                            }
                            if (field.dataset.positionaktion) {
                                const positions = field.dataset.positionaktion.split(';');
                                positions.forEach(position => {
                                    const [prop, value] = position.split(':');
                                    if (prop && value) {
                                        pane.style[prop.trim()] = value.trim();
                                    }
                                });
                            }
                        }

                        // Countdown-Status zurücksetzen
                        if (field.countdownStarted) {
                            clearTimeout(field.countdownTimer);
                            field.countdownStarted = false;
                            delete field.dataset.ready;
                        }
                    }
                });
            }

            clicked = null;
            ghostpane.style.opacity = 0;
            hideGuidelines(guidelines);
        }

        function hintHide() {
            ghostpane.style.opacity = 0;
        }

        function checkOverlap(element) {
            const draggables = document.querySelectorAll('.draggable');
            const rect1 = element.getBoundingClientRect();
            const snapDistance = SNAP_MARGINS;
            let didSnap = false;

            draggables.forEach(other => {
                if (other === element) return;

                const rect2 = other.getBoundingClientRect();

                // Horizontal snapping
                if (Math.abs(rect1.right - rect2.left) < snapDistance) {
                    element.style.left = `${rect2.left - rect1.width}px`;
                    didSnap = true;
                } else if (Math.abs(rect1.left - rect2.right) < snapDistance) {
                    element.style.left = `${rect2.right}px`;
                    didSnap = true;
                }

                // Vertical snapping
                if (Math.abs(rect1.bottom - rect2.top) < snapDistance) {
                    element.style.top = `${rect2.top - rect1.height}px`;
                    didSnap = true;
                } else if (Math.abs(rect1.top - rect2.bottom) < snapDistance) {
                    element.style.top = `${rect2.bottom}px`;
                    didSnap = true;
                }
            });

            return didSnap;
        }

// Hilfsfunktionen
        function hasHTMLElement(a) {
            for (var i in a) if (a[i] instanceof HTMLElement) return true;
            return false;
        }

        function bindEvents(ele, events, callback) {
            events = events.split(' ');
            for (var e in events) ele.addEventListener(events[e], callback);
        }

        return {
            togglePercent: function(state) {
                _usePercent = state !== undefined ? state : !_usePercent;
                setBounds(pane);
            },
            snapFullScreen: function() {
                var preSnap = {width: b.width, height: b.height, top: b.top, left: b.left};
                preSnap.to = [pane, 0, 0, window.innerWidth, window.innerHeight];
                setBounds.apply(this, preSnap.to);
            },
            restorePreSnap: function() {
                if (!preSnap) return;
                var p = preSnap;
                setBounds(pane, p.left, p.top, p.width, p.height);
            },
            center: function() {
                var w = window;
                var pw = w.innerWidth * 0.75;
                var ph = w.innerHeight * 0.75;
                setBounds(pane, (w.innerWidth / 2) - (pw / 2), (w.innerHeight / 2) - (ph / 2), pw, ph);
            }
        };
    }
    return {makeDRS:makeDRS};
};

// Initialize both the original drag-drop and the DRS functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DRS for each draggable element
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach((draggable, index) => {
        // Add ID if not present
        if (!draggable.id) {
            draggable.id = 'draggable-' + index;
        }
        // Initialize DRS for each element
        const drs = core.util.DRS().makeDRS(draggable, 'full', {
            snapStrength: 50, // Adjust this value to control clip strength
            snapEdge: 10,
            resizeInnerM: 5,
            resizeOuterM: 5
        });
    });

    // Ensure draggable elements are always on top while dragging
    const container = document.getElementById('drag-container');
    if (container) {
        container.addEventListener('mousedown', (e) => {
            const target = e.target.closest('.draggable');
            if (target) {
                // Bring the clicked element to the front
                draggables.forEach(draggable => draggable.style.zIndex = 1);
                target.style.zIndex = 1000;
            }
        });
    }
});

