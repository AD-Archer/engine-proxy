import { z } from "zod";

import { normalizeShortcut } from "@/lib/shortcuts";

/**
 * Helper to check if a URL was auto-corrected to include https://
 */
export function wasProtocolAdded(originalUrl: string, normalizedUrl: string): boolean {
  if (typeof originalUrl !== "string" || typeof normalizedUrl !== "string") {
    return false;
  }
  
  // Check if original URL didn't have a protocol
  const hadProtocol = /^https?:\/\//i.test(originalUrl);
  const hasProtocolNow = /^https?:\/\//i.test(normalizedUrl);
  
  return !hadProtocol && hasProtocolNow;
}

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

export const enginePayloadSchema = baseEngineSchema.extend({
  isDefault: baseEngineSchema.shape.isDefault.default(false),
});

export const engineUpdateSchema = baseEngineSchema.partial();

export type EnginePayloadInput = z.infer<typeof enginePayloadSchema>;
export type EngineUpdateInput = z.infer<typeof engineUpdateSchema>;
