import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post()
    create(@Req() req, @Body() createDocumentDto: CreateDocumentDto) {
        const user = req.user;
        return this.documentsService.create(user.uid, { ...createDocumentDto, tenantId: user.activeTenant?.id });
    }

    @Get()
    findAll(@Req() req, @Query('tenantId') tenantId: string) {
        const user = req.user;
        return this.documentsService.findAll(user.uid, tenantId || user.activeTenant?.id);
    }

    @Get(':id')
    findOne(@Req() req, @Param('id') id: string) {
        const user = req.user;
        return this.documentsService.findOne(id, user.uid);
    }

    @Patch(':id')
    update(@Req() req, @Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
        const user = req.user;
        return this.documentsService.update(id, user.uid, updateDocumentDto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        const user = req.user;
        return this.documentsService.remove(id, user.uid);
    }
}
