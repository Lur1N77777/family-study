const LOCAL_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parsePhotoKeys(photoKeyField) {
  if (!photoKeyField) return [];

  try {
    const parsed = JSON.parse(photoKeyField);
    if (Array.isArray(parsed)) return parsed;
    return [photoKeyField];
  } catch {
    return [photoKeyField];
  }
}

export function getLocalDayStart(timestamp = Date.now()) {
  const localDate = new Date(timestamp + LOCAL_OFFSET_MS);
  return Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
  ) - LOCAL_OFFSET_MS;
}

export function getLocalDayEnd(timestamp = Date.now()) {
  return getLocalDayStart(timestamp) + DAY_MS;
}

export function getPhotoAvailableUntil(reviewedAt = Date.now()) {
  return getLocalDayEnd(reviewedAt);
}

export function isSameLocalDay(leftTimestamp, rightTimestamp = Date.now()) {
  if (!leftTimestamp || !rightTimestamp) return false;
  return getLocalDayStart(leftTimestamp) === getLocalDayStart(rightTimestamp);
}

export function getSubmissionPhotoAccessStatus(submission, now = Date.now()) {
  const photoKeys = parsePhotoKeys(submission.photo_key ?? submission.photoKey);
  if (!photoKeys.length) {
    return 'none';
  }

  if (submission.status === 'pending') {
    return 'pending_review';
  }

  const availableUntil = Number(submission.photo_available_until ?? submission.photoAvailableUntil) || 0;
  const reviewedAt = Number(submission.reviewed_at ?? submission.reviewedAt) || 0;
  const clearedAt = Number(submission.photo_cleared_at ?? submission.photoClearedAt) || 0;
  if (clearedAt) {
    return 'expired';
  }
  if (availableUntil) {
    return now < availableUntil ? 'available_today' : 'expired';
  }
  if (reviewedAt && isSameLocalDay(reviewedAt, now)) {
    return 'available_today';
  }

  return 'expired';
}

export function canAccessSubmissionPhotos(submission, now = Date.now()) {
  const accessStatus = getSubmissionPhotoAccessStatus(submission, now);
  return accessStatus === 'pending_review' || accessStatus === 'available_today';
}

export function hydrateSubmissionPhotoState(submission, now = Date.now()) {
  const photoKeys = parsePhotoKeys(submission.photo_key ?? submission.photoKey);
  const reviewedAt = Number(submission.reviewed_at ?? submission.reviewedAt) || null;
  const photoAvailableUntil = Number(submission.photo_available_until ?? submission.photoAvailableUntil) || null;
  const photoAccessStatus = getSubmissionPhotoAccessStatus(submission, now);

  return {
    ...submission,
    photo_count: photoKeys.length,
    photo_access_status: photoAccessStatus,
    photo_available_until: photoAvailableUntil,
    photo_cleared_at: submission.photo_cleared_at ?? submission.photoClearedAt ?? null,
    pending_photo_available: photoAccessStatus === 'pending_review',
    review_photo_available: photoAccessStatus === 'available_today',
    review_photo_expires_at: photoAvailableUntil || (reviewedAt ? getLocalDayEnd(reviewedAt) : null),
  };
}

export async function findAccessibleSubmissionForPhoto(db, familyCode, photoKey) {
  const { results } = await db.prepare(`
      SELECT s.id, s.status, s.photo_key, s.reviewed_at, s.photo_available_until, s.photo_cleared_at
      FROM submissions s
      JOIN users u ON s.child_id = u.id
      WHERE u.family_code = ?
        AND s.photo_key IS NOT NULL
        AND s.photo_key LIKE ?
      LIMIT 50
    `)
    .bind(familyCode, `%${photoKey}%`)
    .all();

  return (results || []).find((submission) => (
    parsePhotoKeys(submission.photo_key).includes(photoKey)
  )) || null;
}

export async function purgeExpiredReviewedPhotos(env, now = Date.now()) {
  const cutoff = getLocalDayStart(now);
  const { results } = await env.DB.prepare(`
      SELECT id, photo_key
      FROM submissions
      WHERE photo_key IS NOT NULL
        AND status IN ('approved', 'rejected')
        AND (
          (photo_available_until IS NOT NULL AND photo_available_until <= ?)
          OR (photo_available_until IS NULL AND reviewed_at IS NOT NULL AND reviewed_at < ?)
        )
        AND photo_cleared_at IS NULL
    `)
    .bind(now, cutoff)
    .all();

  let deletedPhotos = 0;
  let cleanedSubmissions = 0;
  let failedDeletes = 0;

  for (const submission of results || []) {
    const photoKeys = parsePhotoKeys(submission.photo_key);

    for (const key of photoKeys) {
      try {
        if (env.PHOTOS) {
          await env.PHOTOS.delete(key);
        }
        deletedPhotos += 1;
      } catch (error) {
        failedDeletes += 1;
        console.error('Photo cleanup failed', submission.id, key, error);
      }
    }

    await env.DB.prepare('UPDATE submissions SET photo_cleared_at = ? WHERE id = ?')
      .bind(now, submission.id)
      .run();
    cleanedSubmissions += 1;
  }

  return {
    cutoff,
    scannedSubmissions: (results || []).length,
    cleanedSubmissions,
    deletedPhotos,
    failedDeletes,
  };
}

export async function cleanupExpiredSubmissionPhotos(env, now = Date.now()) {
  return purgeExpiredReviewedPhotos(env, now);
}
