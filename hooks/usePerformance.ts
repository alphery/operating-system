import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Performance Optimization Hooks
 * Use these throughout your apps for better performance
 */

/**
 * Debounce hook - Prevents excessive function calls
 * Perfect for: Search inputs, window resize, scroll events
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Throttle hook - Limits function execution rate
 * Perfect for: Scroll handlers, mousemove, resize
 */
export function useThrottle<T>(value: T, limit: number = 200): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
}

/**
 * Intersection Observer hook - Lazy load components
 * Perfect for: Images, heavy components, lists
 */
export function useInView(options?: IntersectionObserverInit) {
    const [isInView, setIsInView] = useState(false);
    const [hasBeenViewed, setHasBeenViewed] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
            if (entry.isIntersecting) {
                setHasBeenViewed(true);
            }
        }, options);

        const currentTarget = targetRef.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [options]);

    return { targetRef, isInView, hasBeenViewed };
}

/**
 * RAF hook - requestAnimationFrame optimization
 * Perfect for: Smooth animations, 60fps updates
 */
export function useRAF(callback: () => void, deps: any[] = []) {
    const rafId = useRef<number | undefined>(undefined);

    useEffect(() => {
        const animate = () => {
            callback();
            rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);

        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, deps);
}

/**
 * Memoized callback that never changes reference
 * Perfect for: Event handlers, callbacks passed to children
 */
export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
    const ref = useRef<T>(fn);

    useEffect(() => {
        ref.current = fn;
    }, [fn]);

    return useCallback<T>(
        ((...args: any[]) => ref.current(...args)) as T,
        []
    );
}

/**
 * Virtual list hook - Only render visible items
 * Perfect for: Long lists (1000+ items), chat messages
 */
export function useVirtualList<T>(items: T[], itemHeight: number, containerHeight: number) {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const endIndex = Math.min(items.length, startIndex + visibleCount + 4);

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return {
        visibleItems,
        offsetY,
        totalHeight: items.length * itemHeight,
        onScroll,
    };
}

/**
 * Idle callback hook - Defer non-critical work
 * Perfect for: Analytics, logging, background tasks
 */
export function useIdleCallback(callback: () => void, deps: any[] = []) {
    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const handle = (window as any).requestIdleCallback(callback);
            return () => (window as any).cancelIdleCallback(handle);
        } else {
            // Fallback for browsers without requestIdleCallback
            const timeout = setTimeout(callback, 1);
            return () => clearTimeout(timeout);
        }
    }, deps);
}

/**
 * Performance monitor hook
 * Perfect for: Debugging performance issues
 */
export function usePerformanceMonitor(componentName: string) {
    const renderCount = useRef(0);
    const startTime = useRef(performance.now());

    useEffect(() => {
        renderCount.current += 1;
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;

        if (process.env.NODE_ENV === 'development') {
            console.log(`[${componentName}] Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
        }

        startTime.current = endTime;
    });

    return renderCount.current;
}

/**
 * Optimized state for large objects
 * Perfect for: Complex forms, large data structures
 */
export function useOptimizedState<T>(initialState: T) {
    const [state, setState] = useState<T>(initialState);
    const stateRef = useRef<T>(initialState);

    const setOptimizedState = useCallback((value: T | ((prev: T) => T)) => {
        const newValue = value instanceof Function ? value(stateRef.current) : value;

        // Only update if actually changed (shallow comparison)
        if (newValue !== stateRef.current) {
            stateRef.current = newValue;
            setState(newValue);
        }
    }, []);

    return [state, setOptimizedState] as const;
}

/**
 * Media query hook with debounce
 * Perfect for: Responsive design, adaptive UI
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

export default {
    useDebounce,
    useThrottle,
    useInView,
    useRAF,
    useEventCallback,
    useVirtualList,
    useIdleCallback,
    usePerformanceMonitor,
    useOptimizedState,
    useMediaQuery,
};
