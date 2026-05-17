import express from 'express';
import cors from 'cors';

import { env } from './config/env';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({
    success: true,
    message: 'API is running',
  });
});

app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});
