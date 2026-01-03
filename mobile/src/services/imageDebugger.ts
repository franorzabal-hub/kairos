/**
 * Image Debugger - Tracks image loading issues during development
 *
 * This service collects all image loading failures to help
 * developers debug Frappe asset access issues.
 *
 * Only active in __DEV__ mode.
 */

export interface ImageLoadResult {
  fileId: string;
  url: string;
  status: 'loading' | 'success' | 'error';
  httpStatus?: number;
  httpStatusText?: string;
  contentType?: string | null;
  corsHeader?: string | null;
  errorMessage?: string;
  authMethod: 'QUERY' | 'HEADER' | 'NONE';
  timestamp: string;
}

type Listener = (item: ImageLoadResult) => void;

class ImageDebugger {
  private results: Map<string, ImageLoadResult> = new Map();
  private listeners: Listener[] = [];

  /**
   * Log an image load attempt.
   */
  logAttempt(fileId: string, url: string, authMethod: 'QUERY' | 'HEADER' | 'NONE'): void {
    if (!__DEV__) return;

    const result: ImageLoadResult = {
      fileId,
      url,
      status: 'loading',
      authMethod,
      timestamp: new Date().toISOString(),
    };

    this.results.set(fileId, result);
    this.notifyListeners(result);
  }

  /**
   * Log a successful image load.
   */
  logSuccess(fileId: string): void {
    if (!__DEV__) return;

    const existing = this.results.get(fileId);
    if (existing) {
      existing.status = 'success';
      this.notifyListeners(existing);
    }
  }

  /**
   * Log an image load error.
   */
  logError(fileId: string, errorMessage: string): void {
    if (!__DEV__) return;

    const existing = this.results.get(fileId);
    if (existing) {
      existing.status = 'error';
      existing.errorMessage = errorMessage;
      this.notifyListeners(existing);
      console.warn('🖼️ IMAGE ERROR:', { fileId: fileId.substring(0, 8), error: errorMessage });
    }
  }

  /**
   * Log fetch test results (HTTP status, CORS headers, etc.)
   */
  logFetchResult(
    fileId: string,
    httpStatus: number,
    httpStatusText: string,
    contentType: string | null,
    corsHeader: string | null
  ): void {
    if (!__DEV__) return;

    const existing = this.results.get(fileId);
    if (existing) {
      existing.httpStatus = httpStatus;
      existing.httpStatusText = httpStatusText;
      existing.contentType = contentType;
      existing.corsHeader = corsHeader;
      this.notifyListeners(existing);
    }
  }

  /**
   * Log a fetch error (CORS blocked, network error, etc.)
   */
  logFetchError(fileId: string, errorMessage: string): void {
    if (!__DEV__) return;

    const existing = this.results.get(fileId);
    if (existing) {
      existing.status = 'error';
      existing.errorMessage = `Fetch: ${errorMessage}`;
      this.notifyListeners(existing);
    }
  }

  private notifyListeners(result: ImageLoadResult): void {
    this.listeners.forEach(fn => fn(result));
  }

  /**
   * Subscribe to image load results.
   * Returns unsubscribe function.
   */
  onResult(callback: Listener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * Get all logged results.
   */
  getAll(): ImageLoadResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get only errors.
   */
  getErrors(): ImageLoadResult[] {
    return this.getAll().filter(r => r.status === 'error');
  }

  /**
   * Get count of errors.
   */
  getErrorCount(): number {
    return this.getErrors().length;
  }

  /**
   * Clear all logged results.
   */
  clear(): void {
    this.results.clear();
  }

  /**
   * Export as text for copying.
   */
  exportAsText(): string {
    const errors = this.getErrors();
    if (errors.length === 0) {
      return 'No image errors logged.';
    }

    const lines = ['Image Loading Errors:', ''];
    for (const r of errors) {
      lines.push(`• ${r.fileId.substring(0, 8)}...`);
      lines.push(`  URL: ${r.url}`);
      lines.push(`  Auth: ${r.authMethod}`);
      if (r.httpStatus) {
        lines.push(`  HTTP: ${r.httpStatus} ${r.httpStatusText}`);
      }
      if (r.contentType) {
        lines.push(`  Content-Type: ${r.contentType}`);
      }
      if (r.corsHeader !== undefined) {
        lines.push(`  CORS: ${r.corsHeader || 'not set'}`);
      }
      if (r.errorMessage) {
        lines.push(`  Error: ${r.errorMessage}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Singleton instance
export const imageDebugger = new ImageDebugger();
