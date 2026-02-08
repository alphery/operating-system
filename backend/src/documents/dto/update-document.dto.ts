import { PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
    @IsString()
    @IsOptional()
    content?: any;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
