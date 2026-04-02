import "server-only";

import { z } from "zod";

const unknownRecordSchema = z.record(z.string(), z.unknown());

const ibmPaCollectionSchema = z.union([
  z.object({
    value: z.array(unknownRecordSchema),
  }),
  z.array(unknownRecordSchema),
]);

const rawServerSchema = z.object({
  Default: z.boolean().optional(),
  Description: z.string().optional(),
  IsDefault: z.boolean().optional(),
  Name: z.string().optional(),
  ServerName: z.string().optional(),
  default: z.boolean().optional(),
  description: z.string().optional(),
  name: z.string().optional(),
  serverName: z.string().optional(),
});

const rawNamedItemSchema = z.object({
  Name: z.string().optional(),
  name: z.string().optional(),
});

const mdxMemberSchema = z.object({
  Element: z
    .object({
      Name: z.string().optional(),
    })
    .optional(),
  Name: z.string().optional(),
  UniqueName: z.string().optional(),
});

const mdxTupleSchema = z.object({
  Members: z.array(mdxMemberSchema).default([]),
});

const mdxAxisSchema = z.object({
  Tuples: z.array(mdxTupleSchema).default([]),
});

const mdxCellValueSchema = z.union([
  z.boolean(),
  z.null(),
  z.number(),
  z.string(),
]);

const mdxCellSchema = z.object({
  FormattedValue: z.string().nullish(),
  Value: mdxCellValueSchema,
});

const mdxExecuteResponseSchema = z.object({
  Axes: z.array(mdxAxisSchema).default([]),
  Cells: z.array(mdxCellSchema).default([]),
});

export {
  ibmPaCollectionSchema,
  mdxExecuteResponseSchema,
  rawNamedItemSchema,
  rawServerSchema,
  unknownRecordSchema,
};
