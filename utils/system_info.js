
export const getSystemInfo = () => {
    if (typeof window === 'undefined') {
        return {
            os: 'Alphery OS',
            browser: 'Unknown',
            cpu: 'Unknown',
            ram: 'Unknown',
            gpu: 'Unknown',
            resolution: 'Unknown'
        };
    }

    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "macOS";
    if (ua.indexOf("X11") !== -1) os = "UNIX";
    if (ua.indexOf("Linux") !== -1) os = "Linux";

    // Attempt to get specific OS version from UA string if possible, generally hard.

    const browser = (() => {
        if (ua.indexOf("Chrome") !== -1) return "Chrome";
        if (ua.indexOf("Firefox") !== -1) return "Firefox";
        if (ua.indexOf("Safari") !== -1) return "Safari";
        return "Unknown Browser";
    })();

    const cpu = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'Unknown';
    const ram = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '8 GB'; // Fallback

    let gpu = 'Unknown GPU';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch (e) {
        console.error("Error getting GPU info:", e);
    }

    const resolution = `${window.screen.width} x ${window.screen.height}`;

    return {
        os,
        browser,
        cpu,
        ram,
        gpu,
        resolution
    };
};
