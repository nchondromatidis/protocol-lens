export interface Range<T = unknown> {
  start: number;
  end: number;
  data: T;
}

/**
 * Efficient lookup of byte ranges within non-overlapping ranges.
 * Pre-sorted during initialization for O(log n) queries.
 */
export class RangeLookup<T = unknown> {
  private readonly ranges: Range<T>[];

  constructor(ranges: Range<T>[]) {
    this.ranges = [...ranges].sort((a, b) => a.start - b.start);
  }

  /**
   * Find a range that fully contains the given range.
   * @returns The containing range with its typed data, or undefined if not found
   */
  findContaining(snippetStart: number, snippetEnd: number): Range<T> | undefined {
    if (this.ranges.length === 0) {
      return undefined;
    }

    // Binary search
    let left = 0;
    let right = this.ranges.length - 1;
    let candidate: Range<T> | undefined;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const range = this.ranges[mid];

      if (range.start <= snippetStart) {
        candidate = range;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // Check if a range is fully contained
    if (candidate && snippetStart >= candidate.start && snippetEnd <= candidate.end) {
      return candidate;
    }

    return undefined;
  }
}
