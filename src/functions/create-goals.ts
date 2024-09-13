import { db } from '../db';
import { goals } from '../db/schema';

interface CreateGoalRequest {
  title: string;
  desireWeeklyFrequency: number;
}

export async function createGoal({
  title,
  desireWeeklyFrequency,
}: CreateGoalRequest) {
  const result = await db
    .insert(goals)
    .values({
      title,
      desireWeeklyFrequency,
    })
    .returning();

  const goal = result[0];

  return { goal };
}
