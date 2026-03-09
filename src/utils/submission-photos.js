import { parsePhotoKeys } from './camera.js';

export function getSubmissionPhotoKeys(submission) {
  return parsePhotoKeys(submission?.photoKey || submission?.photo_key);
}

export function getSubmissionPhotoState(submission, now = Date.now()) {
  const backendState = submission?.photoAccessStatus || submission?.photo_access_status;
  if (backendState) {
    if (backendState === 'available_today') return 'available';
    if (backendState === 'pending_review') return 'pending';
    if (backendState === 'expired') return 'expired';
  }

  const photoKeys = getSubmissionPhotoKeys(submission);
  if (!photoKeys.length) {
    return 'none';
  }

  if (submission?.status === 'pending') {
    return 'pending';
  }

  const availableUntil = Number(
    submission?.reviewPhotoExpiresAt
    || submission?.review_photo_expires_at
    || submission?.photoAvailableUntil
    || submission?.photo_available_until
    || 0,
  );
  const clearedAt = Number(submission?.photoClearedAt || submission?.photo_cleared_at || 0);
  const reviewedAt = Number(submission?.reviewedAt || submission?.reviewed_at || 0);

  if (!clearedAt && availableUntil) {
    return now < availableUntil ? 'available' : 'expired';
  }

  if (!clearedAt && reviewedAt && isSameLocalDay(reviewedAt, now)) {
    return 'available';
  }

  return 'expired';
}

export function canPreviewReviewedSubmissionPhotos(submission, now = Date.now()) {
  return getSubmissionPhotoState(submission, now) === 'available';
}

function isSameLocalDay(leftTimestamp, rightTimestamp) {
  const dayStart = (timestamp) => {
    const offset = 8 * 60 * 60 * 1000;
    const localDate = new Date(timestamp + offset);
    return Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
    ) - offset;
  };

  return dayStart(leftTimestamp) === dayStart(rightTimestamp);
}
