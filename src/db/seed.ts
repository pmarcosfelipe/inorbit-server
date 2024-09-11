import { client, db } from '.';
import { goalCompletion, goals } from './schema';
import dayjs from 'dayjs';

async function seed() {
  await db.delete(goalCompletion);
  await db.delete(goals);

  const result = await db
    .insert(goals)
    .values([
      {
        title: 'Wake Up Early',
        desireWeeklyFrequency: 5,
      },
      {
        title: 'Working Out',
        desireWeeklyFrequency: 3,
      },
      {
        title: 'Meditate',
        desireWeeklyFrequency: 1,
      },
    ])
    .returning();

  const startOfWeek = dayjs().startOf('week');

  await db.insert(goalCompletion).values([
    {
      goalId: result[0].id,
      createdAt: startOfWeek.toDate(),
    },
    {
      goalId: result[1].id,
      createdAt: startOfWeek.add(1, 'day').toDate(),
    },
  ]);
}

seed().finally(() => {
  client.end();
});
