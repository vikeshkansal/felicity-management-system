import z from "zod";

const organizerSchema = z.object({
  name: z.string().min(3),
  category: z.string().min(3),
  description: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
  mobile: z.string().min(10),
  isDisabled: z.boolean().default(false),
  discordWebhook: z.string().min(3).optional()
});

export default organizerSchema;

