import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string(),

  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
