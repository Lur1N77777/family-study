import { describe, expect, it } from 'vitest';
import {
  buildTaskCompletionSnapshot,
  describePenaltySchedule,
  getCurrentTaskWindow,
  getPenaltyWindowToCheck,
  getSubmissionWindowForNow,
} from '../worker/utils/task-periods.js';

describe('task periods', () => {
  it('uses Monday to Sunday windows for weekly tasks', () => {
    const task = {
      id: 'task_weekly',
      type: 'weekly',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    const window = getCurrentTaskWindow(task, Date.parse('2026-03-11T04:00:00.000Z'));

    expect(window).toMatchObject({
      startAt: Date.parse('2026-03-08T16:00:00.000Z'),
      endAt: Date.parse('2026-03-15T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09',
    });
  });

  it('keeps the weekly period but moves the deadline to Saturday end when configured', () => {
    const task = {
      id: 'task_weekly_sat',
      type: 'weekly',
      weekly_rule: 'saturday',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    const window = getCurrentTaskWindow(task, Date.parse('2026-03-15T04:00:00.000Z'));

    expect(window).toMatchObject({
      startAt: Date.parse('2026-03-08T16:00:00.000Z'),
      endAt: Date.parse('2026-03-15T16:00:00.000Z'),
      dueAt: Date.parse('2026-03-14T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09',
    });
  });

  it('opens weekend-twice weekly tasks only on the matching day slot', () => {
    const task = {
      id: 'task_weekly_weekend',
      type: 'weekly',
      weekly_rule: 'weekend_twice',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    expect(getSubmissionWindowForNow(task, Date.parse('2026-03-13T04:00:00.000Z'))).toBeNull();
    expect(getSubmissionWindowForNow(task, Date.parse('2026-03-14T04:00:00.000Z'))).toMatchObject({
      startAt: Date.parse('2026-03-13T16:00:00.000Z'),
      endAt: Date.parse('2026-03-14T16:00:00.000Z'),
      dueAt: Date.parse('2026-03-14T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09:saturday',
    });
    expect(getSubmissionWindowForNow(task, Date.parse('2026-03-15T04:00:00.000Z'))).toMatchObject({
      startAt: Date.parse('2026-03-14T16:00:00.000Z'),
      endAt: Date.parse('2026-03-15T16:00:00.000Z'),
      dueAt: Date.parse('2026-03-15T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09:sunday',
    });
  });

  it('returns the previous local day for daily penalties', () => {
    const task = {
      id: 'task_daily',
      type: 'daily',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    const window = getPenaltyWindowToCheck(task, Date.parse('2026-03-10T00:10:00.000Z'));

    expect(window).toMatchObject({
      startAt: Date.parse('2026-03-08T16:00:00.000Z'),
      endAt: Date.parse('2026-03-09T16:00:00.000Z'),
      periodKey: 'daily:2026-03-09',
    });
  });

  it('checks Saturday-deadline weekly penalties right after the cutoff passes', () => {
    const task = {
      id: 'task_weekly_sat_penalty',
      type: 'weekly',
      weekly_rule: 'saturday',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    const window = getPenaltyWindowToCheck(task, Date.parse('2026-03-14T16:10:00.000Z'));

    expect(window).toMatchObject({
      startAt: Date.parse('2026-03-08T16:00:00.000Z'),
      endAt: Date.parse('2026-03-14T16:00:00.000Z'),
      dueAt: Date.parse('2026-03-14T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09:saturday',
    });
  });

  it('checks weekend-twice penalties one slot at a time', () => {
    const task = {
      id: 'task_weekly_weekend_penalty',
      type: 'weekly',
      weekly_rule: 'weekend_twice',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    expect(getPenaltyWindowToCheck(task, Date.parse('2026-03-14T16:10:00.000Z'))).toMatchObject({
      startAt: Date.parse('2026-03-13T16:00:00.000Z'),
      endAt: Date.parse('2026-03-14T16:00:00.000Z'),
      dueAt: Date.parse('2026-03-14T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09:saturday',
    });
    expect(getPenaltyWindowToCheck(task, Date.parse('2026-03-15T16:10:00.000Z'))).toMatchObject({
      startAt: Date.parse('2026-03-14T16:00:00.000Z'),
      endAt: Date.parse('2026-03-15T16:00:00.000Z'),
      dueAt: Date.parse('2026-03-15T16:00:00.000Z'),
      periodKey: 'weekly:2026-03-09:sunday',
    });
  });

  it('uses the creation day as the overdue window for once tasks', () => {
    const task = {
      id: 'task_once',
      type: 'once',
      created_at: Date.parse('2026-03-07T06:30:00.000Z'),
    };

    const window = getPenaltyWindowToCheck(task, Date.parse('2026-03-08T01:00:00.000Z'));

    expect(window).toMatchObject({
      startAt: Date.parse('2026-03-07T06:30:00.000Z'),
      endAt: Date.parse('2026-03-07T16:00:00.000Z'),
      periodKey: 'once:2026-03-07',
    });
  });

  it('marks unfinished Saturday-deadline tasks overdue after Saturday ends', () => {
    const task = {
      id: 'task_weekly_sat_status',
      type: 'weekly',
      weekly_rule: 'saturday',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    const summary = buildTaskCompletionSnapshot(task, [], Date.parse('2026-03-15T04:00:00.000Z'));

    expect(summary).toMatchObject({
      status: 'overdue',
      requiredCount: 1,
      completedCount: 0,
      canSubmitNow: false,
    });
  });

  it('tracks weekend-twice completion per slot', () => {
    const task = {
      id: 'task_weekly_weekend_status',
      type: 'weekly',
      weekly_rule: 'weekend_twice',
      created_at: Date.parse('2026-03-01T02:00:00.000Z'),
    };

    const summary = buildTaskCompletionSnapshot(task, [
      {
        id: 'sub_sat',
        task_id: 'task_weekly_weekend_status',
        child_id: 'child_1',
        status: 'approved',
        created_at: Date.parse('2026-03-14T02:00:00.000Z'),
      },
      {
        id: 'sub_sun',
        task_id: 'task_weekly_weekend_status',
        child_id: 'child_1',
        status: 'pending',
        created_at: Date.parse('2026-03-15T02:00:00.000Z'),
      },
    ], Date.parse('2026-03-15T04:00:00.000Z'));

    expect(summary).toMatchObject({
      status: 'pending',
      requiredCount: 2,
      completedCount: 1,
      pendingCount: 1,
      canSubmitNow: false,
    });
    expect(summary.slots.map((slot) => ({ key: slot.periodKey, status: slot.status }))).toEqual([
      { key: 'weekly:2026-03-09:saturday', status: 'completed' },
      { key: 'weekly:2026-03-09:sunday', status: 'pending' },
    ]);
  });

  it('describes the visible penalty deadline copy', () => {
    expect(describePenaltySchedule('daily')).toBe('当天 24:00 后扣分');
    expect(describePenaltySchedule('weekly')).toBe('每周日 24:00 后扣分');
    expect(describePenaltySchedule('once')).toBe('创建当天 24:00 后扣分');
    expect(describePenaltySchedule('semester')).toBe('每学期结束后扣分');
  });

  it('blocks once tasks after the creation day cutoff', () => {
    const task = {
      id: 'task_once_cutoff',
      type: 'once',
      created_at: Date.parse('2026-03-07T06:30:00.000Z'),
    };

    expect(getSubmissionWindowForNow(task, Date.parse('2026-03-07T10:00:00.000Z'))).toMatchObject({
      periodKey: 'once:2026-03-07',
    });
    expect(getSubmissionWindowForNow(task, Date.parse('2026-03-08T01:00:00.000Z'))).toBeNull();
  });
});
