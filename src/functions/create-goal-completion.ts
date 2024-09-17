import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { goalCompletion, goals } from '../db/schema';
import dayjs from 'dayjs';

interface CreateGoalCompletionRequest {
  goalId: string;
}

export async function createGoalCompletion({
  goalId,
}: CreateGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').toDate();
  const lastDayOfWeek = dayjs().endOf('week').toDate();

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletion.goalId,
        completionCount: count(goalCompletion.id).as('completionCount'),
      })
      .from(goalCompletion)
      .where(
        and(
          gte(goalCompletion.createdAt, firstDayOfWeek),
          lte(goalCompletion.createdAt, lastDayOfWeek),
          eq(goalCompletion.goalId, goalId)
        )
      )
      .groupBy(goalCompletion.goalId)
  );

  const result = await db
    .with(goalCompletionCounts)
    .select({
      desireWeeklyFrequency: goals.desireWeeklyFrequency,
      completionCount: sql`
        COALESCE(${goalCompletionCounts.completionCount}, 0)
      `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1);

  const { completionCount, desireWeeklyFrequency } = result[0];

  if (completionCount >= desireWeeklyFrequency) {
    throw new Error('Goal already completed this week!');
  }

  const goal = await db.insert(goalCompletion).values({ goalId }).returning();

  return goal[0];
}
