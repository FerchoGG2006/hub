import { useMemo } from "react";

export type TemporalSource = "reservation" | "maintenance" | "manual_hold";

export interface TemporalCapacityInterval {
  id: string;
  startAt: Date | string | number;
  endAt: Date | string | number;
  quantity: number;
  source?: TemporalSource;
  blocksCapacity?: boolean;
}

export interface ConflictWindow {
  startAt: number;
  endAt: number;
  committed: number;
  available: number;
  exceededBy: number;
}

export interface AvailabilityCheck {
  conflict: boolean;
  peakCommitted: number;
  minAvailable: number;
  remainingCapacity: number;
  conflictWindows: ConflictWindow[];
}

export interface AvailabilitySegment {
  startAt: number;
  endAt: number;
  committed: number;
}

export interface UseTemporalAvailabilityOptions {
  capacity: number;
  intervals: TemporalCapacityInterval[];
  activeIntervalId?: string;
}

export interface UseTemporalAvailabilityResult {
  capacity: number;
  segments: AvailabilitySegment[];
  getCommittedAt: (pointInTime: Date | string | number) => number;
  validateRange: (
    startAt: Date | string | number,
    endAt: Date | string | number,
    requestedQty?: number
  ) => AvailabilityCheck;
}

class MaxSegmentTree {
  private readonly size: number;
  private readonly tree: number[];

  constructor(values: number[]) {
    let size = 1;

    while (size < values.length) {
      size <<= 1;
    }

    this.size = size;
    this.tree = new Array(size * 2).fill(0);

    for (let index = 0; index < values.length; index += 1) {
      this.tree[this.size + index] = values[index];
    }

    for (let index = this.size - 1; index > 0; index -= 1) {
      this.tree[index] = Math.max(this.tree[index * 2], this.tree[index * 2 + 1]);
    }
  }

  query(left: number, right: number): number {
    if (left > right) {
      return 0;
    }

    let result = 0;
    let start = left + this.size;
    let end = right + this.size;

    while (start <= end) {
      if ((start & 1) === 1) {
        result = Math.max(result, this.tree[start]);
        start += 1;
      }

      if ((end & 1) === 0) {
        result = Math.max(result, this.tree[end]);
        end -= 1;
      }

      start >>= 1;
      end >>= 1;
    }

    return result;
  }
}

function toEpoch(value: Date | string | number): number {
  if (typeof value === 'number') return value;
  const epoch = value instanceof Date ? value.getTime() : new Date(value).getTime();

  if (!Number.isFinite(epoch)) {
    throw new Error(`Invalid date value received: ${String(value)}`);
  }

  return epoch;
}

function lowerBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (values[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function upperBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (values[mid] <= target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function normalizeIntervals(
  intervals: TemporalCapacityInterval[],
  activeIntervalId?: string
): TemporalCapacityInterval[] {
  return intervals.filter((interval) => {
    if (interval.id === activeIntervalId) {
      return false;
    }

    if (interval.blocksCapacity === false) {
      return false;
    }

    return interval.quantity > 0;
  });
}

export function useTemporalAvailability(
  options: UseTemporalAvailabilityOptions
): UseTemporalAvailabilityResult {
  return useMemo(() => {
    const intervals = normalizeIntervals(options.intervals, options.activeIntervalId);
    const deltas = new Map<number, number>();

    for (const interval of intervals) {
      const startAt = toEpoch(interval.startAt);
      const endAt = toEpoch(interval.endAt);

      if (endAt <= startAt) {
        continue;
      }

      deltas.set(startAt, (deltas.get(startAt) ?? 0) + interval.quantity);
      deltas.set(endAt, (deltas.get(endAt) ?? 0) - interval.quantity);
    }

    const boundaries = Array.from(deltas.keys()).sort((left, right) => left - right);
    const segments: AvailabilitySegment[] = [];

    let runningCommitted = 0;

    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const currentBoundary = boundaries[index];
      const nextBoundary = boundaries[index + 1];

      runningCommitted += deltas.get(currentBoundary) ?? 0;

      if (nextBoundary <= currentBoundary) {
        continue;
      }

      segments.push({
        startAt: currentBoundary,
        endAt: nextBoundary,
        committed: runningCommitted,
      });
    }

    const segmentStarts = segments.map((segment) => segment.startAt);
    const segmentEnds = segments.map((segment) => segment.endAt);
    const tree = new MaxSegmentTree(segments.map((segment) => segment.committed));

    const getCommittedAt = (pointInTime: Date | string | number): number => {
      if (segments.length === 0) {
        return 0;
      }

      const target = toEpoch(pointInTime);
      const candidateIndex = upperBound(segmentEnds, target);

      if (candidateIndex >= segments.length) {
        return 0;
      }

      const segment = segments[candidateIndex];

      if (segment.startAt <= target && target < segment.endAt) {
        return segment.committed;
      }

      return 0;
    };

    const validateRange = (
      startAtInput: Date | string | number,
      endAtInput: Date | string | number,
      requestedQty = 1
    ): AvailabilityCheck => {
      const startAt = toEpoch(startAtInput);
      const endAt = toEpoch(endAtInput);

      if (endAt <= startAt) {
        return {
          conflict: true,
          peakCommitted: 0,
          minAvailable: options.capacity,
          remainingCapacity: options.capacity,
          conflictWindows: [],
        };
      }

      if (segments.length === 0) {
        return {
          conflict: requestedQty > options.capacity,
          peakCommitted: 0,
          minAvailable: options.capacity,
          remainingCapacity: options.capacity - requestedQty,
          conflictWindows: requestedQty > options.capacity
            ? [
                {
                  startAt,
                  endAt,
                  committed: 0,
                  available: options.capacity,
                  exceededBy: requestedQty - options.capacity,
                },
              ]
            : [],
        };
      }

      const left = upperBound(segmentEnds, startAt);
      const right = lowerBound(segmentStarts, endAt) - 1;
      const peakCommitted =
        left <= right && left < segments.length && right >= 0 ? tree.query(left, right) : 0;
      const minAvailable = options.capacity - peakCommitted;
      const remainingCapacity = minAvailable - requestedQty;
      const conflictWindows: ConflictWindow[] = [];

      if (left <= right && left < segments.length && right >= 0) {
        for (let index = left; index <= right; index += 1) {
          const segment = segments[index];
          const exceededBy = segment.committed + requestedQty - options.capacity;

          if (exceededBy > 0) {
            conflictWindows.push({
              startAt: Math.max(segment.startAt, startAt),
              endAt: Math.min(segment.endAt, endAt),
              committed: segment.committed,
              available: options.capacity - segment.committed,
              exceededBy,
            });
          }
        }
      }

      return {
        conflict: requestedQty > minAvailable,
        peakCommitted,
        minAvailable,
        remainingCapacity,
        conflictWindows,
      };
    };

    return {
      capacity: options.capacity,
      segments,
      getCommittedAt,
      validateRange,
    };
  }, [options.activeIntervalId, options.capacity, options.intervals]);
}
