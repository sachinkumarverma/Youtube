/**
 * Formats a duration value to hh:mm:ss or mm:ss format.
 * Accepts seconds as a number or string, or an already-formatted string like "2:10".
 * Examples:
 *   4        → "0:04"
 *   130      → "2:10"
 *   3661     → "1:01:01"
 *   "2:10"   → "2:10"  (already formatted, passed through)
 *   "1:01:01"→ "1:01:01"
 */
export const formatDuration = (duration: string | number | undefined | null): string => {
    if (duration === undefined || duration === null || duration === '') return '0:00';

    const raw = typeof duration === 'number' ? duration : duration.toString().trim();

    // If it's a string that already looks like mm:ss or h:mm:ss, validate and return
    if (typeof raw === 'string' && raw.includes(':')) {
        const parts = raw.split(':');
        // Already properly formatted (e.g. "2:10" or "1:02:10")
        if (parts.length === 2 && parts[1].length <= 2) return raw;
        if (parts.length === 3) return raw;
    }

    // Parse to total seconds
    const totalSeconds = typeof raw === 'string' ? parseFloat(raw) : raw;
    if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const secsStr = secs.toString().padStart(2, '0');

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secsStr}`;
    }
    return `${mins}:${secsStr}`;
};
