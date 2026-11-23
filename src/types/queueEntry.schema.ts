import { z } from 'zod';
import { QueueEntry, QueueStatus } from './queueEntry.types';

export const QueueStatusSchema = z.enum([
    'pending',
    'done',
    'failed',
]);

export const QueueEntrySchema: z.ZodType<QueueEntry> = z.object({
    id: z.string().uuid(),
    url: z.string().url().refine((url) => ['http', 'https'].includes(new URL(url).protocol), 'Must be protocol HTTP or HTTPS'),
    status: QueueStatusSchema,
    submittedAt: z.iso.datetime().transform((d) => new Date(d)),
    mealieSlug: z.string().optional(),
    error: z.string().optional(),
});

export const QueueEntriesSchema = z.array(QueueEntrySchema);
export type { QueueEntry, QueueStatus };