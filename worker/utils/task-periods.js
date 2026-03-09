const LOCAL_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKLY_RULE_SUNDAY = 'sunday';
export const WEEKLY_RULE_SATURDAY = 'saturday';
export const WEEKLY_RULE_WEEKEND_TWICE = 'weekend_twice';

const VALID_WEEKLY_RULES = new Set([
  WEEKLY_RULE_SUNDAY,
  WEEKLY_RULE_SATURDAY,
  WEEKLY_RULE_WEEKEND_TWICE,
]);

export function normalizeWeeklyRule(value) {
  return VALID_WEEKLY_RULES.has(value) ? value : WEEKLY_RULE_SUNDAY;
}

export function getCurrentTaskWindow(task, now = Date.now()) {
  return getTaskCompletionPlan(task, now).period;
}

export function getSubmissionWindowForNow(task, now = Date.now()) {
  const plan = getTaskCompletionPlan(task, now);

  if (task.type === 'once') {
    const slot = plan.slots[0] || null;
    if (!slot) return null;
    return now < (slot.dueAt ?? Number.POSITIVE_INFINITY) ? slot : null;
  }

  if (task.type !== 'weekly') {
    return plan.slots[0] || null;
  }

  const weeklyRule = normalizeWeeklyRule(task.weekly_rule ?? task.weeklyRule);
  if (weeklyRule === WEEKLY_RULE_SATURDAY) {
    const slot = plan.slots[0] || null;
    if (!slot) return null;
    return now < slot.dueAt ? slot : null;
  }

  if (weeklyRule === WEEKLY_RULE_WEEKEND_TWICE) {
    return plan.slots.find((slot) => isTimestampInWindow(now, slot)) || null;
  }

  return plan.slots[0] || null;
}

export function getPenaltyWindowToCheck(task, now = Date.now()) {
  switch (task.type) {
    case 'weekly':
      return getWeeklyPenaltyWindow(task, now);
    case 'semester': {
      const currentWindow = getSemesterWindow(now);
      return getSemesterWindow(currentWindow.startAt - 1);
    }
    case 'once': {
      const onceWindow = getOnceWindow(task);
      if (now < onceWindow.dueAt) {
        return null;
      }

      return {
        ...onceWindow,
        endAt: onceWindow.dueAt,
      };
    }
    case 'daily':
    default: {
      const currentWindow = getDailyWindow(now);
      const startAt = currentWindow.startAt - DAY_MS;
      return createPeriod('daily', startAt, currentWindow.startAt, {
        periodKey: `daily:${getLocalDateKey(startAt)}`,
      });
    }
  }
}

export function buildTaskCompletionSnapshot(task, submissions = [], now = Date.now()) {
  const plan = getTaskCompletionPlan(task, now);
  const slotSnapshots = plan.slots.map((slot) => buildSlotSnapshot(slot, submissions, now));
  const currentSlot = getSubmissionWindowForNow(task, now);
  const currentSlotSnapshot = currentSlot
    ? slotSnapshots.find((slot) => slot.periodKey === currentSlot.periodKey) || null
    : null;
  const latestSubmission = getLatestSubmission(submissions);
  const completedCount = slotSnapshots.filter((slot) => slot.status === 'completed').length;
  const pendingCount = slotSnapshots.filter((slot) => slot.status === 'pending').length;
  const rejectedCount = slotSnapshots.filter((slot) => slot.status === 'rejected').length;
  const overdueCount = slotSnapshots.filter((slot) => slot.status === 'missed').length;
  const requiredCount = slotSnapshots.length;
  const canSubmitNow = Boolean(currentSlotSnapshot && (currentSlotSnapshot.status === 'todo' || currentSlotSnapshot.status === 'rejected'));

  let status = 'todo';
  if (requiredCount > 0 && completedCount === requiredCount) {
    status = 'completed';
  } else if (pendingCount > 0) {
    status = 'pending';
  } else if (overdueCount > 0 && !canSubmitNow) {
    status = 'overdue';
  } else if (completedCount > 0) {
    status = 'partial';
  } else if (rejectedCount > 0) {
    status = 'rejected';
  } else if (slotSnapshots.every((slot) => now < slot.startAt)) {
    status = 'upcoming';
  }

  return {
    periodKey: plan.period.periodKey,
    periodStartAt: plan.period.startAt,
    periodEndAt: plan.period.endAt,
    dueAt: plan.period.dueAt ?? plan.period.endAt ?? null,
    requiredCount,
    completedCount,
    pendingCount,
    rejectedCount,
    overdueCount,
    status,
    canSubmitNow,
    currentSubmission: currentSlotSnapshot?.submission ?? null,
    latestSubmission,
    currentSlotKey: currentSlotSnapshot?.periodKey ?? null,
    currentSlotEndsAt: currentSlotSnapshot?.dueAt ?? null,
    slots: slotSnapshots,
  };
}

export function getTaskCompletionPlan(task, now = Date.now()) {
  switch (task.type) {
    case 'weekly':
      return getWeeklyPlan(task, now);
    case 'semester': {
      const period = getSemesterWindow(now);
      return {
        period,
        slots: [createSlot(period.periodKey, period.startAt, period.endAt, {
          dueAt: period.dueAt,
          label: 'semester',
        })],
      };
    }
    case 'once': {
      const period = getOnceWindow(task);
      return {
        period,
        slots: [createSlot(period.periodKey, period.startAt, period.endAt, {
          dueAt: period.dueAt,
          label: 'once',
        })],
      };
    }
    case 'daily':
    default: {
      const period = getDailyWindow(now);
      return {
        period,
        slots: [createSlot(period.periodKey, period.startAt, period.endAt, {
          dueAt: period.dueAt,
          label: 'daily',
        })],
      };
    }
  }
}

export function isTimestampInWindow(timestamp, window) {
  if (typeof timestamp !== 'number') return false;
  if (timestamp < window.startAt) return false;
  if (window.endAt == null) return true;
  return timestamp < window.endAt;
}

export function wasTaskActiveDuringWindow(task, window) {
  return (task.created_at || 0) < (window.endAt ?? Number.POSITIVE_INFINITY);
}

export function describePenaltySchedule(type) {
  switch (type) {
    case 'weekly':
      return '\u6bcf\u5468\u65e5 24:00 \u540e\u6263\u5206';
    case 'once':
      return '\u521b\u5efa\u5f53\u5929 24:00 \u540e\u6263\u5206';
    case 'semester':
      return '\u6bcf\u5b66\u671f\u7ed3\u675f\u540e\u6263\u5206';
    case 'daily':
    default:
      return '\u5f53\u5929 24:00 \u540e\u6263\u5206';
  }
}

export function getLocalDateKey(timestamp) {
  const localDate = new Date(timestamp + LOCAL_OFFSET_MS);
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailyWindow(timestamp) {
  const startAt = getLocalDayStart(timestamp);
  return createPeriod('daily', startAt, startAt + DAY_MS, {
    periodKey: `daily:${getLocalDateKey(startAt)}`,
  });
}

function getWeeklyPlan(task, timestamp) {
  const weeklyRule = normalizeWeeklyRule(task.weekly_rule ?? task.weeklyRule);
  const startAt = getLocalWeekStart(timestamp);
  const endAt = startAt + (7 * DAY_MS);
  const saturdayStart = startAt + (5 * DAY_MS);
  const sundayStart = startAt + (6 * DAY_MS);
  const basePeriodKey = `weekly:${getLocalDateKey(startAt)}`;

  if (weeklyRule === WEEKLY_RULE_SATURDAY) {
    const dueAt = sundayStart;
    const period = createPeriod('weekly', startAt, endAt, {
      dueAt,
      periodKey: basePeriodKey,
    });

    return {
      period,
      slots: [createSlot(`${basePeriodKey}:saturday`, startAt, dueAt, {
        dueAt,
        label: 'saturday_deadline',
      })],
    };
  }

  if (weeklyRule === WEEKLY_RULE_WEEKEND_TWICE) {
    const period = createPeriod('weekly', startAt, endAt, {
      dueAt: endAt,
      periodKey: basePeriodKey,
    });

    return {
      period,
      slots: [
        createSlot(`${basePeriodKey}:saturday`, saturdayStart, sundayStart, {
          dueAt: sundayStart,
          label: 'saturday',
        }),
        createSlot(`${basePeriodKey}:sunday`, sundayStart, endAt, {
          dueAt: endAt,
          label: 'sunday',
        }),
      ],
    };
  }

  const period = createPeriod('weekly', startAt, endAt, {
    dueAt: endAt,
    periodKey: basePeriodKey,
  });

  return {
    period,
    slots: [createSlot(basePeriodKey, startAt, endAt, {
      dueAt: endAt,
      label: 'weekly',
    })],
  };
}

function getWeeklyPenaltyWindow(task, now) {
  const currentPlan = getWeeklyPlan(task, now);
  const previousPlan = getWeeklyPlan(task, now - (7 * DAY_MS));
  const candidates = [...previousPlan.slots, ...currentPlan.slots]
    .filter((slot) => slot.dueAt != null && slot.dueAt <= now && now < (slot.dueAt + DAY_MS))
    .sort((a, b) => b.dueAt - a.dueAt);

  return candidates[0] || null;
}

function getSemesterWindow(timestamp) {
  const localDate = new Date(timestamp + LOCAL_OFFSET_MS);
  const year = localDate.getUTCFullYear();
  const month = localDate.getUTCMonth();
  const isFirstHalf = month < 6;

  const startLocal = isFirstHalf
    ? Date.UTC(year, 0, 1)
    : Date.UTC(year, 6, 1);
  const endLocal = isFirstHalf
    ? Date.UTC(year, 6, 1)
    : Date.UTC(year + 1, 0, 1);

  const startAt = startLocal - LOCAL_OFFSET_MS;
  const endAt = endLocal - LOCAL_OFFSET_MS;

  return createPeriod('semester', startAt, endAt, {
    dueAt: endAt,
    periodKey: `semester:${year}:${isFirstHalf ? 'H1' : 'H2'}`,
  });
}

function getOnceWindow(task) {
  const startAt = task.created_at || Date.now();
  const dueAt = getLocalDayStart(startAt) + DAY_MS;

  return createPeriod('once', startAt, null, {
    dueAt,
    periodKey: `once:${getLocalDateKey(startAt)}`,
  });
}

function getLocalDayStart(timestamp) {
  const localDate = new Date(timestamp + LOCAL_OFFSET_MS);
  return Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
  ) - LOCAL_OFFSET_MS;
}

function getLocalWeekStart(timestamp) {
  const currentDayStart = getLocalDayStart(timestamp);
  const localDay = new Date(currentDayStart + LOCAL_OFFSET_MS).getUTCDay();
  const daysSinceMonday = (localDay + 6) % 7;
  return currentDayStart - (daysSinceMonday * DAY_MS);
}

function buildSlotSnapshot(slot, submissions, now) {
  const submission = getLatestSubmission(submissions.filter((item) => isTimestampInWindow(item.created_at, slot)));
  const isOpen = slot.endAt == null || now < (slot.dueAt ?? slot.endAt);

  let status = 'todo';
  if (submission?.status === 'approved') {
    status = 'completed';
  } else if (submission?.status === 'pending') {
    status = 'pending';
  } else if (submission?.status === 'rejected' && isOpen) {
    status = 'rejected';
  } else if (now < slot.startAt) {
    status = 'upcoming';
  } else if (!isOpen) {
    status = 'missed';
  }

  return {
    ...slot,
    status,
    submission: submission || null,
  };
}

function getLatestSubmission(submissions) {
  if (!Array.isArray(submissions) || submissions.length === 0) return null;

  return submissions.reduce((latest, current) => {
    if (!latest) return current;
    return (current.created_at || 0) > (latest.created_at || 0) ? current : latest;
  }, null);
}

function createPeriod(type, startAt, endAt, { dueAt = endAt, periodKey }) {
  return {
    type,
    startAt,
    endAt,
    dueAt,
    periodKey,
  };
}

function createSlot(periodKey, startAt, endAt, { dueAt = endAt, label }) {
  return {
    periodKey,
    startAt,
    endAt,
    dueAt,
    label,
  };
}
