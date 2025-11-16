/**
 * Performance Optimization Utilities
 * 
 * Provides caching, memoization, and optimization strategies
 * for improved performance with large datasets.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export class PerformanceOptimizer {
  private static cache = new Map<string, CacheEntry<any>>();
  private static metrics: PerformanceMetrics[] = [];
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Memoized function wrapper with caching
   */
  public static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl: number = this.DEFAULT_TTL
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cached = this.getFromCache(key);
      
      if (cached !== null) {
        this.recordMetric('cache_hit', 0, 0, 1);
        return cached;
      }
      
      const startTime = performance.now();
      const result = fn(...args);
      const duration = performance.now() - startTime;
      
      this.setCache(key, result, ttl);
      this.recordMetric('cache_miss', duration, this.getMemoryUsage(), 0);
      
      return result;
    }) as T;
  }

  /**
   * Debounced function wrapper
   */
  public static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
  ): T {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  /**
   * Throttled function wrapper
   */
  public static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number = 100
  ): T {
    let inThrottle: boolean;
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  /**
   * Batch processing for large datasets
   */
  public static async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Yield control to prevent blocking
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }

  /**
   * Virtual scrolling for large lists
   */
  public static createVirtualScroll<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ): { visibleItems: T[]; startIndex: number; endIndex: number; totalHeight: number } {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    
    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight
    };
  }

  /**
   * Lazy loading for images and components
   */
  public static createLazyLoader<T>(
    loader: () => Promise<T>,
    fallback?: T
  ): () => Promise<T> {
    let cached: T | null = null;
    let loading: Promise<T> | null = null;
    
    return async (): Promise<T> => {
      if (cached !== null) {
        return cached;
      }
      
      if (loading !== null) {
        return loading;
      }
      
      loading = loader().then(result => {
        cached = result;
        loading = null;
        return result;
      });
      
      return loading;
    };
  }

  /**
   * Cache management
   */
  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private static setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear expired cache entries
   */
  public static clearExpiredCache(): void {
    const now = Date.now();

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  public static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Performance monitoring
   */
  private static recordMetric(operation: string, duration: number, memoryUsage: number, cacheHitRate: number): void {
    this.metrics.push({
      operation,
      duration,
      memoryUsage,
      cacheHitRate
    });
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance metrics
   */
  public static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get average performance metrics
   */
  public static getAverageMetrics(): {
    averageDuration: number;
    averageMemoryUsage: number;
    averageCacheHitRate: number;
    totalOperations: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageDuration: 0,
        averageMemoryUsage: 0,
        averageCacheHitRate: 0,
        totalOperations: 0
      };
    }
    
    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    const totalMemory = this.metrics.reduce((sum, metric) => sum + metric.memoryUsage, 0);
    const totalCacheHits = this.metrics.reduce((sum, metric) => sum + metric.cacheHitRate, 0);
    
    return {
      averageDuration: totalDuration / this.metrics.length,
      averageMemoryUsage: totalMemory / this.metrics.length,
      averageCacheHitRate: totalCacheHits / this.metrics.length,
      totalOperations: this.metrics.length
    };
  }

  /**
   * Get memory usage
   */
  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Optimize large array operations
   */
  public static async optimizeArrayOperations<T>(
    array: T[],
    operations: Array<(arr: T[]) => T[]>
  ): Promise<T[]> {
    // Use Web Workers for large arrays if available
    if (array.length > 10000 && typeof Worker !== 'undefined') {
      return this.processWithWorker(array, operations);
    }

    // Use batch processing for medium arrays
    if (array.length > 1000) {
      return this.processBatch(array, async (batch) => {
        let result = batch;
        for (const operation of operations) {
          result = operation(result);
        }
        return result;
      }, 100);
    }

    // Direct processing for small arrays
    let result = array;
    for (const operation of operations) {
      result = operation(result);
    }
    return result;
  }

  /**
   * Process with Web Worker (placeholder - would need actual worker implementation)
   */
  private static async processWithWorker<T>(array: T[], operations: Array<(arr: T[]) => T[]>): Promise<T[]> {
    // Fallback to batch processing for now
    return this.processBatch(array, async (batch) => {
      let result = batch;
      for (const operation of operations) {
        result = operation(result);
      }
      return result;
    }, 1000);
  }

  /**
   * Optimize DOM operations
   */
  public static optimizeDOMOperations(operations: (() => void)[]): void {
    // Use DocumentFragment for multiple DOM operations
    const fragment = document.createDocumentFragment();
    
    // Batch DOM operations
    requestAnimationFrame(() => {
      operations.forEach(operation => operation());
    });
  }

  /**
   * Image optimization
   */
  public static optimizeImage(
    src: string,
    width?: number,
    height?: number,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        const targetWidth = width || img.width;
        const targetHeight = height || img.height;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = src;
    });
  }

  /**
   * Database query optimization
   */
  public static optimizeQuery<T>(
    data: T[],
    filters: Array<(item: T) => boolean>,
    sortBy?: (a: T, b: T) => number,
    limit?: number
  ): T[] {
    let result = data;
    
    // Apply filters in order of selectivity (most selective first)
    const sortedFilters = filters.sort((a, b) => {
      // This is a simplified approach - in practice, you'd analyze filter selectivity
      return 0;
    });
    
    for (const filter of sortedFilters) {
      result = result.filter(filter);
    }
    
    // Apply sorting if specified
    if (sortBy) {
      result.sort(sortBy);
    }
    
    // Apply limit if specified
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * Cleanup and garbage collection
   */
  public static cleanup(): void {
    this.clearExpiredCache();
    this.metrics = [];
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }
}

// Export optimized versions of common functions
export const memoizedCalculateTargetProfit = PerformanceOptimizer.memoize(
  (capital: number, trades: number, accuracy: number, rr: number) => {
    // This would be the actual calculation function
    return { capital, trades, accuracy, rr };
  },
  (capital, trades, accuracy, rr) => `calc_${capital}_${trades}_${accuracy}_${rr}`,
  10 * 60 * 1000 // 10 minutes cache
);

export const debouncedSearch = PerformanceOptimizer.debounce(
  (query: string, callback: (results: any[]) => void) => {
    // Search implementation
    callback([]);
  },
  300
);

export const throttledScroll = PerformanceOptimizer.throttle(
  (callback: () => void) => {
    callback();
  },
  16 // ~60fps
);

















