'use server';
import { config } from 'dotenv';
config({ path: `.env` });

import '@/ai/flows/generate-tasks.ts';
import '@/ai/flows/organize-tasks.ts';
