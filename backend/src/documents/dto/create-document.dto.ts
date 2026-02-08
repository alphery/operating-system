import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsBoolean, IsObject } from 'class-validator';

enum DocumentType {
    DOCUMENT = 'DOCUMENT',
    SPREADSHEET = 'SPREADSHEET',
    PRESENTATION = 'PRESENTATION',
}

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsEnum(DocumentType)
    @IsOptional()
    type: DocumentType;

    @IsString()
    @IsOptional()
    tenantId?: string;

    @IsObject()
    @IsOptional()
    content?: Record<string, any>;
}
