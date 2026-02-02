import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    priority?: string;

    @IsNumber()
    @IsOptional()
    budget?: number;

    @IsString()
    @IsOptional()
    clientId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}
