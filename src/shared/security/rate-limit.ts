export interface RateLimiter {
  isAllowed(key: string, limit: number, windowMs: number): boolean;
}

export class InMemoryRateLimiter implements RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter out timestamps outside the sliding window
    const active = timestamps.filter((t) => now - t < windowMs);
    
    if (active.length >= limit) {
      this.requests.set(key, active);
      return false;
    }
    
    active.push(now);
    this.requests.set(key, active);
    return true;
  }

  clear(): void {
    this.requests.clear();
  }
}
