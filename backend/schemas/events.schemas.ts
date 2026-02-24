import z from "zod";

const customFormFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldType: z.enum(['text', 'dropdown', 'checkbox', 'file']),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  order: z.number().int().min(0)
});

const itemDetailsSchema = z.object({
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  variants: z.array(z.string()).default([])
});

const baseFields = {
  name: z.string().min(3),
  description: z.string().min(3),
  start: z.string(),
  end: z.string(),
  tags: z.array(z.string()),
  eligibility: z.enum(['IIIT-H', 'External', 'All']),
  regDeadline: z.string(),
  regLimit: z.number(),
  regFee: z.number(),
  organizer: z.string().min(3),
  status: z.enum(['draft', 'published', 'closed', 'ongoing', 'completed']).default('draft')
};

const eventSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseFields,
    type: z.literal("normal"),
    customForm: z.array(customFormFieldSchema).optional().default([])
  }),
  z.object({
    ...baseFields,
    type: z.literal("merchandise"),
    itemDetails: itemDetailsSchema.optional().default({ sizes: [], colors: [], variants: [] }),
    stockQuantity: z.number().int().min(0).default(0),
    purchaseLimitPerParticipant: z.number().int().min(1).default(1)
  })
]);

export default eventSchema;
export { customFormFieldSchema, itemDetailsSchema };
