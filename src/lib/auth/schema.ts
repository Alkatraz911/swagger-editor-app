import { z } from "zod";

/**
 * Password rules (Unicode-aware via the `u` flag):
 * min 8 chars, at least one letter, one digit and one special character.
 * Error strings are i18n keys (translated in the form).
 */
export const passwordSchema = z
  .string()
  .min(8, "min8")
  .regex(/\p{L}/u, "letter")
  .regex(/\p{N}/u, "digit")
  .regex(/[^\p{L}\p{N}]/u, "special");

export const credentialsSchema = z.object({
  email: z.string().email("email"),
  password: passwordSchema,
});

export type Credentials = z.infer<typeof credentialsSchema>;
