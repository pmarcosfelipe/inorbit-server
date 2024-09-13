import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { createGoal } from '../functions/create-goals';
import z from 'zod';

const app = fastify().withTypeProvider<ZodTypeProvider>();

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.post(
  '/goals',
  {
    schema: {
      body: z.object({
        title: z.string(),
        desireWeeklyFrequency: z.number().int().min(1).max(7),
      }),
    },
  },
  async request => {
    const { title, desireWeeklyFrequency } = request.body;
    await createGoal({
      title,
      desireWeeklyFrequency,
    });
  }
);

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP server running...');
  });
