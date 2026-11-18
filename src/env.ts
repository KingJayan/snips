import { defineEnvVars } from "@sveltejs/kit/env";

const optional = (value: string | undefined) => value?.trim() || undefined;
const publicOptional = { public: true, schema: optional };
const privateOptional = { schema: optional };

export const variables = defineEnvVars({
  SUPABASE_URL: publicOptional,
  SUPABASE_PUBLISHABLE_KEY: publicOptional,
  APP_URL: publicOptional,
  DEV_OWNER_EMAIL: publicOptional,
  OPENAI_API_KEY: privateOptional,
  ANTHROPIC_API_KEY: privateOptional,
  GEMINI_API_KEY: privateOptional,
  OPENROUTER_API_KEY: privateOptional,
});
