import { z } from "zod";

import { normalizeSiteShortcut } from "@/lib/settings";
import { normalizeShortcut } from "@/lib/shortcuts";

const shortcutSchema = z
  .string()
  .min(1, "Shortcut should be at least 1 character")
  .max(24, "Shortcut should be 24 characters or fewer")
  .regex(/^[^\s'"]+$/, "Anything except spaces and quotes is allowed")
  .transform((val) => normalizeShortcut(val));

const urlTemplateSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    // First replace %s with {query}
    let normalized = val.replace(/%s/g, "{query}");
    
    // Auto-prepend https:// if no protocol is present
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  }
  return val;
}, z
  .string()
  .min(10, "Template should include a valid URL")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL must start with http:// or https://"
  )
  .refine(
    (value) => value.includes("{query}"),
    "Template must include a {query} placeholder (or %s)"
  ));

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

const siteShortcutSchema = z
  .string()
  .min(1, "Site shortcut should be at least 1 character")
  .max(24, "Site shortcut should be 24 characters or fewer")
  .regex(/^[^\s'"]+$/, "Anything except spaces and quotes is allowed")
  .transform((val) => normalizeSiteShortcut(val));

export const enginePayloadSchema = baseEngineSchema.extend({
  isDefault: baseEngineSchema.shape.isDefault.default(false),
});

export const engineUpdateSchema = baseEngineSchema.partial();
export const siteShortcutPayloadSchema = z.object({
  siteShortcut: siteShortcutSchema,
  autoAppendComForSiteShortcut: z.boolean().optional(),
});

export type EnginePayloadInput = z.infer<typeof enginePayloadSchema>;
export type EngineUpdateInput = z.infer<typeof engineUpdateSchema>;
export type SiteShortcutPayloadInput = z.infer<typeof siteShortcutPayloadSchema>;
