import { z } from 'zod';

const baseSchema = z.object({
  PORT: z.coerce.number().optional(),
  CORS_ORIGIN: z.string().optional(),
  COOKIE_SECRET: z.string().min(10),
  SSO_INTROSPECTION_URL: z.string().url(),
  SESSION_COOKIE_NAME: z.string().min(3).default('gaqno_session'),
  REFRESH_COOKIE_NAME: z.string().min(3).default('gaqno_refresh'),
});

export type BaseEnvConfig = z.infer<typeof baseSchema>;

export const createEnvValidation = (additionalSchema?: z.ZodObject<any>) => {
  const schema = additionalSchema
    ? baseSchema.merge(additionalSchema)
    : baseSchema;

  return (config: Record<string, unknown>): Record<string, unknown> => {
    const parsed = schema.safeParse(config);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }
    return parsed.data;
  };
};

export const baseEnvValidation = createEnvValidation();

