import { z } from "zod";

/**
 * Redes sociais da DM: chaves fixas, cada uma uma URL opcional. Sem plataforma inventada aqui —
 * só as que aparecem em docs/01 (§24, rodapé).
 */
export const SOCIAL_PLATFORMS = ["instagram", "linkedin", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialSchema = z
  .object({
    instagram: z.url().optional(),
    linkedin: z.url().optional(),
    facebook: z.url().optional(),
  })
  .strict();

export type Social = z.infer<typeof socialSchema>;

export function parseSocial(raw: unknown): Social {
  const parsed = socialSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}
