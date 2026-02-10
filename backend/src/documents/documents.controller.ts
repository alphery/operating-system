import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post()
    create(@Body() createDocumentDto: any) {
        return this.documentsService.create(createDocumentDto);
    }

    @Get()
    findAll() {
        return this.documentsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.documentsService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.documentsService.remove(id);
    }
}
