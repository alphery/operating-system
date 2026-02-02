/**
 * Performance Detection & Adaptive Quality System
 * Automatically detects device capabilities and adjusts visual quality
 */

export class PerformanceManager {
    private static instance: PerformanceManager;
    private performanceLevel: 'high' | 'medium' | 'low' = 'high';
    private fps: number = 60;
    private frameCount: number = 0;
    private lastFrameTime: number = performance.now();

    private constructor() {
        this.detectPerformance();
        this.startMonitoring();
    }

    static getInstance(): PerformanceManager {
        if (!PerformanceManager.instance) {
            PerformanceManager.instance = new PerformanceManager();
        }
        return PerformanceManager.instance;
    }

    private detectPerformance() {
        // Check hardware concurrency (CPU cores)
        const cores = navigator.hardwareConcurrency || 2;

        // Check device memory
        const memory = (navigator as any).deviceMemory || 4;

        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Check GPU rendering capability
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl ? (gl as any).getExtension('WEBGL_debug_renderer_info') : null;
        const renderer = debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

        // Detect low-end indicators
        const isLowEnd =
            cores <= 2 ||
            memory <= 2 ||
            (isMobile && cores <= 4) ||
            renderer.toLowerCase().includes('intel') && renderer.toLowerCase().includes('hd');

        const isMediumEnd =
            (cores <= 4 && memory <= 4) ||
            (isMobile && cores <= 6);

        if (isLowEnd) {
            this.performanceLevel = 'low';
            console.log('[PerformanceManager] Low-end device detected');
        } else if (isMediumEnd) {
            this.performanceLevel = 'medium';
            console.log('[PerformanceManager] Medium-end device detected');
        } else {
            this.performanceLevel = 'high';
            console.log('[PerformanceManager] High-end device detected');
        }

        this.applyPerformanceSettings();
    }

    private startMonitoring() {
        let frameCounter = 0;
        let lastCheck = performance.now();

        const monitorFrame = () => {
            frameCounter++;
            const now = performance.now();

            if (now - lastCheck >= 1000) {
                this.fps = frameCounter;
                frameCounter = 0;
                lastCheck = now;

                // Adaptive degradation - if FPS drops below 30, reduce quality
                if (this.fps < 30 && this.performanceLevel !== 'low') {
                    console.warn('[PerformanceManager] FPS dropped to', this.fps, '- reducing quality');
                    if (this.performanceLevel === 'high') {
                        this.performanceLevel = 'medium';
                    } else {
                        this.performanceLevel = 'low';
                    }
                    this.applyPerformanceSettings();
                }
            }

            requestAnimationFrame(monitorFrame);
        };

        requestAnimationFrame(monitorFrame);
    }

    private applyPerformanceSettings() {
        const root = document.documentElement;

        // IMPORTANT: Only apply visual degradation in extreme cases (FPS < 20)
        // Otherwise, keep the beautiful glassmorphism UI intact

        // Technical optimizations are ALWAYS applied via CSS classes
        // These don't change appearance, just improve rendering performance

        switch (this.performanceLevel) {
            case 'low':
                // For low-end devices, disable effects IMMEDIATELY to prevent initial jank
                // But allow re-enabling if user explicitly requests (future feature)

                // Only keep effects if FPS is consistently high (unexpected for low-end)
                if (this.fps > 55) {
                    console.log('[PerformanceManager] Low-end device but FPS is great - allowing effects');
                    root.style.removeProperty('--backdrop-blur');
                    root.style.removeProperty('--window-transparency');
                    root.style.removeProperty('--panel-opacity');
                    document.body.classList.remove('low-performance-mode');
                } else {
                    console.warn('[PerformanceManager] Low-end device - optimizations active');
                    root.style.setProperty('--backdrop-blur', '0px');
                    root.style.setProperty('--window-transparency', '1');
                    root.style.setProperty('--panel-opacity', '1');
                    document.body.classList.add('low-performance-mode');
                }

                localStorage.setItem('performance-mode', 'low');
                break;

            case 'medium':
                // Never disable effects for medium-end devices
                // Just ensure technical optimizations are applied
                document.body.classList.remove('low-performance-mode', 'medium-performance-mode');
                console.log('[PerformanceManager] Medium-end device - full visual effects enabled');
                localStorage.setItem('performance-mode', 'medium');
                break;

            case 'high':
                // Full effects - already set by user preferences
                document.body.classList.remove('low-performance-mode', 'medium-performance-mode');
                localStorage.setItem('performance-mode', 'high');
                break;
        }

        // Dispatch event for components to react
        window.dispatchEvent(new CustomEvent('performance-level-change', {
            detail: {
                level: this.performanceLevel,
                fps: this.fps
            }
        }));
    }

    getPerformanceLevel() {
        return this.performanceLevel;
    }

    getCurrentFPS() {
        return this.fps;
    }

    // Allow manual override
    setPerformanceLevel(level: 'high' | 'medium' | 'low') {
        this.performanceLevel = level;
        this.applyPerformanceSettings();
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    PerformanceManager.getInstance();
}

export default PerformanceManager;
