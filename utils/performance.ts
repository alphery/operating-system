/**
 * Performance Utilities
 * Debounce, throttle, and other performance helpers
 */

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Request Animation Frame throttle for 60fps max
export function rafThrottle<T extends (...args: any[]) => any>(
    func: T
): (...args: Parameters<T>) => void {
    let rafId: number | null = null;

    return function executedFunction(...args: Parameters<T>) {
        if (rafId) {
            return;
        }

        rafId = requestAnimationFrame(() => {
            func(...args);
            rafId = null;
        });
    };
}

// Lazy load images
export function lazyLoadImage(img: HTMLImageElement) {
    if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
    } else {
        // Fallback for browsers that don't support native lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLImageElement;
                    target.src = target.dataset.src || '';
                    observer.unobserve(target);
                }
            });
        });
        observer.observe(img);
    }
}

// Check if device is low-end
export function isLowEndDevice(): boolean {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return cores <= 2 || memory <= 2 || (isMobile && cores <= 4);
}

// Reduce image quality on low-end devices
export function getOptimizedImageSrc(src: string, lowEnd: boolean = isLowEndDevice()): string {
    if (lowEnd && src.includes('.jpg')) {
        // Could implement server-side image optimization here
        return src.replace('.jpg', '-low.jpg');
    }
    return src;
}

export default {
    debounce,
    throttle,
    rafThrottle,
    lazyLoadImage,
    isLowEndDevice,
    getOptimizedImageSrc
};
