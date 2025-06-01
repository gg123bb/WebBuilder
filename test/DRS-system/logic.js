var core = core || {};
core.util = core.util || {};
// Globale Funktion zum Initialisieren von Trackpoints
function initializeExistingTrackpoints() {
    const trackpoints = document.querySelectorAll('.trackpoint');

    trackpoints.forEach(trackpoint => {
        // Wenn kein parent-id gesetzt ist, versuche das Elternelement zu verwenden
        if (!trackpoint.dataset.parentId) {
            const parentElement = trackpoint.closest('.DRS');
            if (parentElement && parentElement.id) {
                trackpoint.dataset.parentId = parentElement.id;
            }
        }

        // Event-Listener für den Trackpoint
        trackpoint.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            trackpoint.isDragging = true;
            trackpoint.offsetX = e.clientX;
            trackpoint.offsetY = e.clientY;

            // Trackpoint visuell hervorheben
            const originalBoxShadow = trackpoint.style.boxShadow;
            trackpoint.dataset.originalBoxShadow = originalBoxShadow;

            const parentElement = document.getElementById(trackpoint.dataset.parentId);
            if (parentElement && parentElement.dataset.trackpointActiveBoxShadow) {
                trackpoint.style.boxShadow = parentElement.dataset.trackpointActiveBoxShadow;
            } else {
                trackpoint.style.boxShadow = '0 0 8px rgba(255,87,34,0.8)';
            }
        });
    });
}

// Globale Funktion zum Erstellen von Trackpoints
function createTrackpoint(element) {
    // Prüfen ob bereits ein Trackpoint existiert
    if (element.querySelector('.trackpoint')) return;

    // Trackpoint erstellen
    const trackpoint = document.createElement('div');
    trackpoint.className = 'trackpoint';

    // Standardwerte für Trackpoint
    let trackpointSize = 12;
    let trackpointX = -6;
    let trackpointY = -6;
    let trackpointColor = 'var(--trackpoint-color, #ff5722)';
    let trackpointBorderRadius = '50%';
    let trackpointZIndex = 1001;
    let trackpointBoxShadow = '0 0 3px rgba(0,0,0,0.3)';

    // Dynamische Attribute aus Datenattributen auslesen
    if (element.dataset.trackpointSize) {
        trackpointSize = parseInt(element.dataset.trackpointSize);
        trackpointX = -trackpointSize/2;
        trackpointY = -trackpointSize/2;
    }

    if (element.dataset.trackpointPosition) {
        const position = element.dataset.trackpointPosition.split(',');
        if (position.length === 2) {
            trackpointX = position[0].trim();
            trackpointY = position[1].trim();
        }
    }

    if (element.dataset.trackpointColor) {
        trackpointColor = element.dataset.trackpointColor;
    }

    if (element.dataset.trackpointBorderRadius) {
        trackpointBorderRadius = element.dataset.trackpointBorderRadius;
    }

    if (element.dataset.trackpointZIndex) {
        trackpointZIndex = element.dataset.trackpointZIndex;
    }

    if (element.dataset.trackpointBoxShadow) {
        trackpointBoxShadow = element.dataset.trackpointBoxShadow;
    }

    // CSS für den Trackpoint setzen
    trackpoint.style.cssText = `
        position: absolute;
        width: ${trackpointSize}px;
        height: ${trackpointSize}px;
        background-color: ${trackpointColor};
        border-radius: ${trackpointBorderRadius};
        top: ${trackpointY}px;
        left: ${trackpointX}px;
        cursor: move;
        z-index: ${trackpointZIndex};
        box-shadow: ${trackpointBoxShadow};
        pointer-events: all;
    `;

    // Benutzerdefiniertes CSS aus data-trackpoint-css
    if (element.dataset.trackpointCss) {
        const cssProperties = element.dataset.trackpointCss.split(';');
        cssProperties.forEach(property => {
            if (property.trim()) {
                const [name, value] = property.split(':');
                if (name && value) {
                    trackpoint.style[name.trim()] = value.trim();
                }
            }
        });
    }

    // Dem Element zuordnen
    trackpoint.dataset.parentId = element.id;
    element.appendChild(trackpoint);

    // Event-Listener für den Trackpoint
    trackpoint.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        trackpoint.isDragging = true;
        trackpoint.offsetX = e.clientX;
        trackpoint.offsetY = e.clientY;

        // Trackpoint visuell hervorheben
        const originalBoxShadow = trackpoint.style.boxShadow;
        trackpoint.dataset.originalBoxShadow = originalBoxShadow;
        trackpoint.style.boxShadow = element.dataset.trackpointActiveBoxShadow ||
            '0 0 8px rgba(255,87,34,0.8)';
    });

    return trackpoint;
}
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
            // Prüfen, ob Clipping für dieses Element aktiviert ist
            if (element.dataset.clipping !== "true") {
                return false;
            }

            const CLIP_THRESHOLD = 15;
            const elementRect = element.getBoundingClientRect();
            let didClip = false;

            others.forEach(other => {
                // Prüfen, ob das andere Element auch Clipping aktiviert hat
                if (other === element || other.dataset.clipping !== "true") return;

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
            // Prüfen, ob Clipping für dieses Element aktiviert ist
            if (element.dataset.clipping !== "true") {
                return false;
            }

            const drsElements = document.querySelectorAll('.DRS');
            const rect1 = element.getBoundingClientRect();
            const GRID_SIZE = 10;
            const SNAP_THRESHOLD = 20;

            // Grid snapping
            const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

            // Get element center point
            const centerX = rect1.left + rect1.width / 2;
            const centerY = rect1.top + rect1.height / 2;

            drsElements.forEach(other => {
                if (other === element || other.dataset.clipping !== "true") return;

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

        function createTrackpoint(element) {
            // Prüfen ob bereits ein Trackpoint existiert
            if (element.querySelector('.trackpoint')) return;

            // Trackpoint erstellen
            const trackpoint = document.createElement('div');
            trackpoint.className = 'trackpoint';

            // Standardwerte für Trackpoint
            let trackpointSize = 12;
            let trackpointX = -6;
            let trackpointY = -6;
            let trackpointColor = 'var(--trackpoint-color, #ff5722)';
            let trackpointBorderRadius = '50%';
            let trackpointZIndex = 1001;
            let trackpointBoxShadow = '0 0 3px rgba(0,0,0,0.3)';

            // Dynamische Attribute aus Datenattributen auslesen
            if (element.dataset.trackpointSize) {
                trackpointSize = parseInt(element.dataset.trackpointSize);
                trackpointX = -trackpointSize/2;
                trackpointY = -trackpointSize/2;
            }

            if (element.dataset.trackpointPosition) {
                const position = element.dataset.trackpointPosition.split(',');
                if (position.length === 2) {
                    trackpointX = position[0].trim();
                    trackpointY = position[1].trim();
                }
            }

            if (element.dataset.trackpointColor) {
                trackpointColor = element.dataset.trackpointColor;
            }

            if (element.dataset.trackpointBorderRadius) {
                trackpointBorderRadius = element.dataset.trackpointBorderRadius;
            }

            if (element.dataset.trackpointZIndex) {
                trackpointZIndex = element.dataset.trackpointZIndex;
            }

            if (element.dataset.trackpointBoxShadow) {
                trackpointBoxShadow = element.dataset.trackpointBoxShadow;
            }

            // CSS für den Trackpoint setzen
            trackpoint.style.cssText = `
        position: absolute;
        width: ${trackpointSize}px;
        height: ${trackpointSize}px;
        background-color: ${trackpointColor};
        border-radius: ${trackpointBorderRadius};
        top: ${trackpointY}px;
        left: ${trackpointX}px;
        cursor: move;
        cursor: move;
        z-index: ${trackpointZIndex};
        box-shadow: ${trackpointBoxShadow};
        pointer-events: all;
    `;

            // Benutzerdefiniertes CSS aus data-trackpoint-css
            if (element.dataset.trackpointCss) {
                const cssProperties = element.dataset.trackpointCss.split(';');
                cssProperties.forEach(property => {
                    if (property.trim()) {
                        const [name, value] = property.split(':');
                        if (name && value) {
                            trackpoint.style[name.trim()] = value.trim();
                        }
                    }
                });
            }

            // Dem Element zuordnen
            trackpoint.dataset.parentId = element.id;
            element.appendChild(trackpoint);

            // Event-Listener für den Trackpoint
            trackpoint.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                trackpoint.isDragging = true;
                trackpoint.offsetX = e.clientX;
                trackpoint.offsetY = e.clientY;

                // Trackpoint visuell hervorheben
                const originalBoxShadow = trackpoint.style.boxShadow;
                trackpoint.dataset.originalBoxShadow = originalBoxShadow;
                trackpoint.style.boxShadow = element.dataset.trackpointActiveBoxShadow ||
                    '0 0 8px rgba(255,87,34,0.8)';
            });

            return trackpoint;
        }


        function initializeExistingTrackpoints() {
            const trackpoints = document.querySelectorAll('.trackpoint');

            trackpoints.forEach(trackpoint => {
                // Wenn kein parent-id gesetzt ist, versuche das Elternelement zu verwenden
                if (!trackpoint.dataset.parentId) {
                    const parentElement = trackpoint.closest('.DRS');
                    if (parentElement && parentElement.id) {
                        trackpoint.dataset.parentId = parentElement.id;
                    }
                }

                // Event-Listener für den Trackpoint
                trackpoint.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    trackpoint.isDragging = true;
                    trackpoint.offsetX = e.clientX;
                    trackpoint.offsetY = e.clientY;

                    // Trackpoint visuell hervorheben
                    const originalBoxShadow = trackpoint.style.boxShadow;
                    trackpoint.dataset.originalBoxShadow = originalBoxShadow;

                    const parentElement = document.getElementById(trackpoint.dataset.parentId);
                    if (parentElement && parentElement.dataset.trackpointActiveBoxShadow) {
                        trackpoint.style.boxShadow = parentElement.dataset.trackpointActiveBoxShadow;
                    } else {
                        trackpoint.style.boxShadow = '0 0 8px rgba(255,87,34,0.8)';
                    }
                });
            });
        }

        function onDown(e) {
            calc(e);

            // Prüfen, ob Resizing für dieses Element aktiviert ist
            var canResize = pane.dataset.resizing === "true";
            var isResizing = canResize && (onRightEdge || onBottomEdge || onTopEdge || onLeftEdge);

            // Prüfen, ob Drag für dieses Element aktiviert ist
            var canDrag = pane.dataset.drag === "true";
            var isMoving = canDrag && !isResizing && canMove();

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

            // Element in den Vordergrund bringen, wenn es bewegt oder größengeändert wird
            if (isMoving || isResizing) {
                const allDrsElements = document.querySelectorAll('.DRS');
                allDrsElements.forEach(d => d.style.zIndex = "1");
                pane.style.zIndex = "1000";

                // Verhindern, dass das Event an andere Elemente weitergegeben wird
                e.stopPropagation();
                e.preventDefault();
            }
        }

        function canMove() {
            // Wenn Drag nicht aktiviert ist, sofort false zurückgeben
            if (pane.dataset.drag !== "true") {
                return false;
            }

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
                e.style.zIndex = "1";
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
                var canResize = pane.dataset.resizing === "true";

                if (canResize) {
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
                } else if (canMove()) {
                    db.style.cursor = 'move';
                } else {
                    db.style.cursor = 'default';
                }
                // Trackpoint-Bewegung auch behandeln, wenn nicht geklickt
                handleTrackpointMove(ee);
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

            // Bewegung des Hauptelements
            if (clicked && clicked.isMoving) {
                // Grundlegende Bewegung
                pane.style.left = (e.clientX - clicked.x) + 'px';
                pane.style.top = (e.clientY - clicked.y) + 'px';

                // Clipping-Logik nur anwenden, wenn aktiviert
                if (pane.dataset.clipping === "true") {
                    const nearbyElements = Array.from(document.querySelectorAll('.DRS')).filter(el => el !== pane);
                    clipElements(pane, nearbyElements);
                }

                // Ladekreis-Position aktualisieren
                loadingCircle.style.left = (ee.clientX - 17) + 'px';
                loadingCircle.style.top = (ee.clientY - 15) + 'px';

                // Prüfen, ob das Element über einem Aktionsfeld ist
                checkElementOverActionField(pane, ee);
            }

            // Trackpoint-Bewegung behandeln
            handleTrackpointMove(ee);
        }

// Neue Funktion, um zu prüfen, ob ein Element über einem Aktionsfeld ist
        function checkElementOverActionField(element, event) {
            isOverActionField = false;
            const aktionfields = document.querySelectorAll('.aktionfield');

            aktionfields.forEach(field => {
                const fieldRect = field.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
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
                        updateGhostPane(field);
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
                    } else {
                        // Sofortige Aktivierung, wenn kein Countdown gesetzt ist
                        field.dataset.ready = "true";
                        isCountdownComplete = true;

                        // Sofort Änderungen anwenden für flüssigere Erfahrung
                        applyActionFieldChanges(field, element);
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

// Funktion zum Aktualisieren des Ghost-Panes basierend auf Aktionsfeld-Eigenschaften
        function updateGhostPane(field) {
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

        // Neue Funktion zum Anwenden von Aktionsfeld-Änderungen auf ein Element
        function applyActionFieldChanges(field, element) {
            if (field.dataset.widthaktion) {
                element.style.width = field.dataset.widthaktion.includes('%') ||
                field.dataset.widthaktion.includes('vw') ?
                    field.dataset.widthaktion :
                    field.dataset.widthaktion + '%';
            }
            if (field.dataset.heightaktion) {
                element.style.height = field.dataset.heightaktion.includes('%') ||
                field.dataset.heightaktion.includes('vh') ?
                    field.dataset.heightaktion :
                    field.dataset.heightaktion + '%';
            }
            if (field.dataset.positionaktion) {
                const positions = field.dataset.positionaktion.split(';');
                positions.forEach(position => {
                    const [prop, value] = position.split(':');
                    if (prop && value) {
                        element.style[prop.trim()] = value.trim();
                    }
                });
            }
        }

        // Neue Funktion zum Zurücksetzen der Trackpoint-Position
        function resetTrackpointPosition(trackpoint, parentElement) {
            // Ursprüngliche Position aus den Datenattributen ermitteln
            let trackpointX = -6;
            let trackpointY = -6;

            if (parentElement.dataset.trackpointSize) {
                const size = parseInt(parentElement.dataset.trackpointSize);
                trackpointX = -size/2;
                trackpointY = -size/2;
            }

            if (parentElement.dataset.trackpointPosition) {
                const position = parentElement.dataset.trackpointPosition.split(',');
                if (position.length === 2) {
                    trackpointX = position[0].trim();
                    trackpointY = position[1].trim();
                }
            }

            trackpoint.style.top = `${trackpointY}px`;
            trackpoint.style.left = `${trackpointX}px`;
        }

// Verbesserte Funktion zum Behandeln von Trackpoint-Bewegungen
        function handleTrackpointMove(e) {
            const trackpoints = document.querySelectorAll('.trackpoint');

            trackpoints.forEach(trackpoint => {
                if (trackpoint.isDragging) {
                    // Trackpoint bewegen
                    const newLeft = (e.clientX - trackpoint.offsetX + parseInt(trackpoint.style.left || -6));
                    const newTop = (e.clientY - trackpoint.offsetY + parseInt(trackpoint.style.top || -6));

                    trackpoint.style.left = `${newLeft}px`;
                    trackpoint.style.top = `${newTop}px`;

                    // Überprüfen, ob der Trackpoint über einem Aktionsfeld ist
                    const aktionfields = document.querySelectorAll('.aktionfield');
                    let isOverField = false;

                    aktionfields.forEach(field => {
                        const fieldRect = field.getBoundingClientRect();
                        const trackpointRect = trackpoint.getBoundingClientRect();

                        if (trackpointRect.left + trackpointRect.width/2 > fieldRect.left &&
                            trackpointRect.left + trackpointRect.width/2 < fieldRect.right &&
                            trackpointRect.top + trackpointRect.height/2 > fieldRect.top &&
                            trackpointRect.top + trackpointRect.height/2 < fieldRect.bottom) {

                            isOverField = true;

                            // Zeige Vorschau für das Hauptelement an
                            const parentElement = document.getElementById(trackpoint.dataset.parentId);
                            if (parentElement) {
                                if (field.dataset.type === "preview") {
                                    updateGhostPane(field);
                                }

                                // Countdown-Logik für Trackpoint
                                const countdownValue = parseInt(field.dataset.couldown);
                                if (countdownValue >= 0) {
                                    if (!field.trackpointCountdownStarted) {
                                        field.trackpointCountdownStarted = true;
                                        field.trackpointCountdownTime = countdownValue;

                                        loadingCircle.style.display = 'block';
                                        loadingCircle.style.left = (e.clientX - 17) + 'px';
                                        loadingCircle.style.top = (e.clientY - 15) + 'px';

                                        const secondsValue = countdownValue / 1000;
                                        loadingCircle.style.animation = `spin ${secondsValue}s linear`;

                                        field.trackpointCountdownTimer = setTimeout(() => {
                                            field.dataset.trackpointReady = "true";
                                            loadingCircle.classList.add('loading-circle-complete');
                                        }, countdownValue);
                                    }
                                } else {
                                    // Sofortige Aktivierung, wenn kein Countdown gesetzt ist
                                    field.dataset.trackpointReady = "true";

                                    // Sofort Änderungen anwenden für flüssigere Erfahrung
                                    applyActionFieldChanges(field, parentElement);
                                }
                            }
                        }
                    });

                    if (!isOverField) {
                        // Zurücksetzen, wenn nicht über einem Feld
                        aktionfields.forEach(field => {
                            if (field.trackpointCountdownStarted) {
                                clearTimeout(field.trackpointCountdownTimer);
                                field.trackpointCountdownStarted = false;
                                delete field.dataset.trackpointReady;
                            }
                        });
                        ghostpane.style.opacity = 0;
                    }

                    trackpoint.offsetX = e.clientX;
                    trackpoint.offsetY = e.clientY;
                }
            });
        }
        //ende on onMove

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

            // Trackpoint-Handling
            const trackpoints = document.querySelectorAll('.trackpoint');
            trackpoints.forEach(trackpoint => {
                if (trackpoint.isDragging) {
                    trackpoint.isDragging = false;

                    // Box-Shadow zurücksetzen
                    if (trackpoint.dataset.originalBoxShadow) {
                        trackpoint.style.boxShadow = trackpoint.dataset.originalBoxShadow;
                        delete trackpoint.dataset.originalBoxShadow;
                    } else {
                        trackpoint.style.boxShadow = '0 0 3px rgba(0,0,0,0.3)';
                    }

                    const parentElement = document.getElementById(trackpoint.dataset.parentId);
                    if (parentElement) {
                        const aktionfields = document.querySelectorAll('.aktionfield');
                        aktionfields.forEach(field => {
                            const fieldRect = field.getBoundingClientRect();
                            const trackpointRect = trackpoint.getBoundingClientRect();

                            if (trackpointRect.left + trackpointRect.width/2 > fieldRect.left &&
                                trackpointRect.left + trackpointRect.width/2 < fieldRect.right &&
                                trackpointRect.top + trackpointRect.height/2 > fieldRect.top &&
                                trackpointRect.top + trackpointRect.height/2 < fieldRect.bottom) {

                                // Nur Änderungen anwenden, wenn Countdown abgeschlossen oder kein Countdown gesetzt ist
                                if (!field.dataset.couldown || field.dataset.trackpointReady === "true") {
                                    applyActionFieldChanges(field, parentElement);

                                    // Trackpoint zurück zur Standardposition, wenn konfiguriert
                                    if (parentElement.dataset.trackpointReset === "true") {
                                        resetTrackpointPosition(trackpoint, parentElement);
                                    }
                                }

                                // Countdown-Status zurücksetzen
                                if (field.trackpointCountdownStarted) {
                                    clearTimeout(field.trackpointCountdownTimer);
                                    field.trackpointCountdownStarted = false;
                                    delete field.dataset.trackpointReady;
                                }
                            }
                        });
                    }
                }
            });

            // Element-Handling
            if (clicked && clicked.isMoving) {
                // Snapping beim Loslassen nur anwenden, wenn Clipping aktiviert ist
                if (pane.dataset.clipping === "true") {
                    handleSnap(pane);
                }

                const aktionfields = document.querySelectorAll('.aktionfield');
                aktionfields.forEach(field => {
                    const fieldRect = field.getBoundingClientRect();
                    const elementRect = pane.getBoundingClientRect();
                    const centerX = elementRect.left + elementRect.width / 2;
                    const centerY = elementRect.top + elementRect.height / 2;

                    if (centerX > fieldRect.left && centerX < fieldRect.right &&
                        centerY > fieldRect.top && centerY < fieldRect.bottom) {

                        // Nur Änderungen anwenden, wenn Countdown abgeschlossen oder kein Countdown gesetzt ist
                        if (!field.dataset.couldown || field.dataset.ready === "true") {
                            applyActionFieldChanges(field, pane);
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

        function applyActionFieldChanges(field, element) {
            if (field.dataset.widthaktion) {
                element.style.width = field.dataset.widthaktion.includes('%') ||
                field.dataset.widthaktion.includes('vw') ?
                    field.dataset.widthaktion :
                    field.dataset.widthaktion + '%';
            }
            if (field.dataset.heightaktion) {
                element.style.height = field.dataset.heightaktion.includes('%') ||
                field.dataset.heightaktion.includes('vh') ?
                    field.dataset.heightaktion :
                    field.dataset.heightaktion + '%';
            }
            if (field.dataset.positionaktion) {
                const positions = field.dataset.positionaktion.split(';');
                positions.forEach(position => {
                    const [prop, value] = position.split(':');
                    if (prop && value) {
                        element.style[prop.trim()] = value.trim();
                    }
                });
            }
        }

// Neue Funktion zum Zurücksetzen der Trackpoint-Position
        function resetTrackpointPosition(trackpoint, parentElement) {
            // Ursprüngliche Position aus den Datenattributen ermitteln
            let trackpointX = -6;
            let trackpointY = -6;

            if (parentElement.dataset.trackpointSize) {
                const size = parseInt(parentElement.dataset.trackpointSize);
                trackpointX = -size/2;
                trackpointY = -size/2;
            }

            if (parentElement.dataset.trackpointPosition) {
                const position = parentElement.dataset.trackpointPosition.split(',');
                if (position.length === 2) {
                    trackpointX = position[0].trim();
                    trackpointY = position[1].trim();
                }
            }
            trackpoint.style.top = `${trackpointY}px`;
            trackpoint.style.left = `${trackpointX}px`;
        }

        function hintHide() {
            ghostpane.style.opacity = 0;
        }

        function checkOverlap(element) {
            const drsElements = document.querySelectorAll('.DRS');
            const rect1 = element.getBoundingClientRect();
            const snapDistance = SNAP_MARGINS;
            let didSnap = false;

            drsElements.forEach(other => {
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
// Modifiziere die DOMContentLoaded Event-Listener, um bestehende Trackpoints zu initialisieren
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DRS for each DRS element
    const drsElements = document.querySelectorAll('.DRS');
    drsElements.forEach((drsElement, index) => {
        // Add ID if not present
        if (!drsElement.id) {
            drsElement.id = 'DRS-' + index;
        }

        // Standardmäßig ist Drag deaktiviert, sofern nicht explizit aktiviert
        if (drsElement.dataset.drag !== "true") {
            drsElement.dataset.drag = "false";
        }

        // Standardmäßig ist Clipping deaktiviert, sofern nicht explizit aktiviert
        if (drsElement.dataset.clipping !== "true") {
            drsElement.dataset.clipping = "false";
        }

        // Standardmäßig ist Resizing deaktiviert, sofern nicht explizit aktiviert
        if (drsElement.dataset.resizing !== "true") {
            drsElement.dataset.resizing = "false";
        }

        // Initialize DRS for each element
        const drs = core.util.DRS().makeDRS(drsElement, 'full', {
            snapStrength: 50,
            snapEdge: 10,
            resizeInnerM: 5,
            resizeOuterM: 5
        });

        // Trackpoint erstellen, wenn das Element die Klasse 'has-trackpoint' hat und noch keinen Trackpoint enthält
        if ((drsElement.classList.contains('has-trackpoint') || drsElement.dataset.trackpoint === "true") &&
            !drsElement.querySelector('.trackpoint')) {
            createTrackpoint(drsElement);
        }
    });

    // Initialisiere bestehende Trackpoints
    initializeExistingTrackpoints();

    // Ensure DRS elements are always on top while dragging
    const container = document.getElementById('drag-container');
    if (container) {
        container.addEventListener('mousedown', (e) => {
            const target = e.target.closest('.DRS');
            if (target) {
                // Bring the clicked element to the front
                drsElements.forEach(drsElement => drsElement.style.zIndex = 1);
                target.style.zIndex = 1000;
            }
        });
    }
});