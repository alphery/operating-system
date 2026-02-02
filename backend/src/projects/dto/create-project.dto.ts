import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    overview?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    priority?: string;

    @IsNumber()
    @IsOptional()
    budget?: number;

    @IsNumber()
    @IsOptional()
    spent?: number;

    @IsNumber()
    @IsOptional()
    progress?: number;

    @IsString()
    @IsOptional()
    startDate?: string;

    @IsString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    clientId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}
