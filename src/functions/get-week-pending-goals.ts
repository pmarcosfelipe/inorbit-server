import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { db } from '../db';
import { goalCompletion, goals } from '../db/schema';
import { and, count, eq, gte, lte, sql } from 'drizzle-orm';

dayjs.extend(weekOfYear);

export async function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate();
  const lastDayOfWeek = dayjs().endOf('week').toDate();

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desireWeeklyFrequency: goals.desireWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  );

  const goalsCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletion.goalId,
        completionCount: count(goalCompletion.id).as('completionCount'),
      })
      .from(goalCompletion)
      .where(
        and(
          gte(goalCompletion.createdAt, firstDayOfWeek),
          lte(goalCompletion.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalCompletion.goalId)
  );

  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalsCompletionCounts)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desireWeeklyFrequency: goalsCreatedUpToWeek.desireWeeklyFrequency,
      completionCount: sql`
        COALESCE(${goalsCompletionCounts.completionCount}, 0)
      `.mapWith(Number),
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalsCompletionCounts,
      eq(goalsCompletionCounts.goalId, goalsCreatedUpToWeek.id)
    );

  return { pendingGoals };
}
