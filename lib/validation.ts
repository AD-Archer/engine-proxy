import { z } from "zod";

import { normalizeShortcut } from "@/lib/shortcuts";

const shortcutSchema = z
  .string()
  .min(2, "Shortcut should be at least 2 characters")
  .max(24, "Shortcut should be 24 characters or fewer")
  .regex(
    /^[a-z0-9_-]+$/i,
    "Only letters, numbers, dashes, and underscores are allowed"
  )
  .transform((val) => normalizeShortcut(val));

const urlTemplateSchema = z
  .string()
  .min(10, "Template should include a valid URL")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL must start with http:// or https://"
  )
  .refine(
    (value) => value.includes("{query}"),
    "Template must include a {query} placeholder"
  );

const descriptionSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  if (val === undefined) {
    return null;
  }
  return val;
}, z.string().max(180).nullable());

const baseEngineSchema = z.object({
  shortcut: shortcutSchema,
  displayName: z.string().min(2).max(80),
  description: descriptionSchema,
  urlTemplate: urlTemplateSchema,
  isDefault: z.boolean().optional(),
});

export const enginePayloadSchema = baseEngineSchema.extend({
  isDefault: baseEngineSchema.shape.isDefault.default(false),
});

export const engineUpdateSchema = baseEngineSchema.partial();

export type EnginePayloadInput = z.infer<typeof enginePayloadSchema>;
export type EngineUpdateInput = z.infer<typeof engineUpdateSchema>;
