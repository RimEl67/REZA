import { z } from 'zod';

const servicePricingFields = {
  price: z.number().optional(),
  priceType: z.enum(['FIXED', 'FROM', 'RANGE']).default('FIXED'),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  onQuote: z.boolean().default(false),
};

function validateServicePricingRules(
  data: z.infer<typeof baseServiceSchema>,
  ctx: z.RefinementCtx
) {
  if (data.onQuote) return;

  const priceType = data.priceType ?? 'FIXED';

  if (priceType === 'FIXED') {
    if (data.price == null || data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prix doit être supérieur à 0',
        path: ['price'],
      });
    }
    return;
  }

  if (priceType === 'FROM') {
    if (data.priceFrom == null || data.priceFrom <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prix minimum doit être supérieur à 0',
        path: ['priceFrom'],
      });
    }
    return;
  }

  if (priceType === 'RANGE') {
    if (data.priceFrom == null || data.priceFrom <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prix minimum doit être supérieur à 0',
        path: ['priceFrom'],
      });
    }
    if (data.priceTo == null || data.priceTo <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prix maximum doit être supérieur à 0',
        path: ['priceTo'],
      });
    }
    if (
      data.priceFrom != null &&
      data.priceTo != null &&
      data.priceFrom > data.priceTo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prix minimum ne peut pas dépasser le prix maximum',
        path: ['priceTo'],
      });
    }
  }
}

const baseServiceSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().default('#002366'),
  ...servicePricingFields,
  duration: z.number().int().positive(),
  visibility: z.enum(['BOOKABLE', 'VISIBLE', 'HIDDEN']).default('BOOKABLE'),
  multipleProviders: z.boolean().default(false),
  competences: z.array(z.string()).default([]),
  employeeIds: z.array(z.string()).optional(),
});

export const createServiceSchema = baseServiceSchema.superRefine(validateServicePricingRules);

export const updateServiceSchema = baseServiceSchema
  .partial()
  .superRefine((data, ctx) => {
    const touchesPricing =
      data.priceType !== undefined ||
      data.price !== undefined ||
      data.priceFrom !== undefined ||
      data.priceTo !== undefined ||
      data.onQuote !== undefined;

    if (!touchesPricing) return;

    validateServicePricingRules(
      {
        name: data.name ?? '',
        priceType: data.priceType ?? 'FIXED',
        price: data.price,
        priceFrom: data.priceFrom,
        priceTo: data.priceTo,
        onQuote: data.onQuote ?? false,
        duration: data.duration ?? 1,
        color: data.color ?? '#002366',
        visibility: data.visibility ?? 'BOOKABLE',
        multipleProviders: data.multipleProviders ?? false,
        competences: data.competences ?? [],
      },
      ctx
    );
  });
