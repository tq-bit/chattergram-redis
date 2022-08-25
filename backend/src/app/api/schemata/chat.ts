import { Static, Type } from '@sinclair/typebox';

export const PublicFileSchema = Type.Object({
  audioFileUuid: Type.String({ format: 'uuid' }),
  audioFileName: Type.String(),
  audioFileMimetype: Type.String(),
});

export const UserUploadResponseSchema = Type.Object({
  files: Type.Array(PublicFileSchema),
});

export const FileResponseSchema = Type.Object({
  audioFile: Type.Optional(Type.String()),
  audioFileUuid: Type.Optional(Type.String()),
  audioFileName: Type.Optional(Type.String()),
  audioFileMimetype: Type.Optional(Type.String()),
});

export type UserUploadResponseSchemaType = Static<
  typeof UserUploadResponseSchema
>;
export type PublicFileSchemaType = Static<typeof PublicFileSchema>;
export type FileResponseSchemaType = Static<typeof FileResponseSchema>;
