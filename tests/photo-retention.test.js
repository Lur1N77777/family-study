import { describe, expect, it, vi } from 'vitest';
import { cleanupExpiredSubmissionPhotos, getPhotoAvailableUntil } from '../worker/utils/photo-retention.js';

describe('photo retention', () => {
  it('calculates the end of the current local day for reviewed photos', () => {
    const reviewedAt = Date.parse('2026-03-09T15:30:00.000Z');

    expect(getPhotoAvailableUntil(reviewedAt)).toBe(Date.parse('2026-03-09T16:00:00.000Z'));
  });

  it('deletes expired reviewed photos and marks submissions as cleared', async () => {
    const deletedKeys = [];
    const clearedRuns = [];

    const env = {
      DB: {
        prepare(sql) {
          return {
            bind(...args) {
              if (sql.includes('FROM submissions')) {
                return {
                  all: async () => ({
                    results: [
                      { id: 'sub_1', photo_key: JSON.stringify(['photo_a', 'photo_b']) },
                      { id: 'sub_2', photo_key: 'photo_c' },
                    ],
                  }),
                };
              }

              if (sql.startsWith('UPDATE submissions SET photo_cleared_at')) {
                return {
                  run: async () => {
                    clearedRuns.push(args);
                    return {};
                  },
                };
              }

              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      },
      PHOTOS: {
        delete: vi.fn(async (key) => {
          deletedKeys.push(key);
        }),
      },
    };

    const now = Date.parse('2026-03-09T16:05:00.000Z');
    const result = await cleanupExpiredSubmissionPhotos(env, now);

    expect(deletedKeys).toEqual(['photo_a', 'photo_b', 'photo_c']);
    expect(clearedRuns).toEqual([
      [now, 'sub_1'],
      [now, 'sub_2'],
    ]);
    expect(result).toMatchObject({
      scannedSubmissions: 2,
      cleanedSubmissions: 2,
      deletedPhotos: 3,
      failedDeletes: 0,
    });
  });
});
