import { z } from "zod";

export const scanSchema = z.object({
  repoUrl: z
    .string()
    .max(2000)
    .regex(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/),
});

export const prioritizeSchema = z.object({
  violations: z
    .array(
      z
        .object({ type: z.string(), file: z.string(), line: z.number() })
        .passthrough(),
    )
    .min(1)
    .max(500),
  consentToAi: z.literal(true),
});

export const prSchema = z.object({
  repoUrl: z
    .string()
    .max(2000)
    .regex(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/),
  group: z
    .object({
      category: z.string().max(100),
      violations: z.array(z.any()).min(1).max(500),
    })
    .passthrough(),
  dryRun: z.boolean().optional(),
  consentToAi: z.literal(true),
});
