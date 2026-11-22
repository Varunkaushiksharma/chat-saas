export type Bot = {
  id: string;
  name: string;
  tone: string;
  system_instructions: string;
  fallback_message: string;
  confidence_threshold: number;
  public_key: string;
  allowed_domains: string[];
};
