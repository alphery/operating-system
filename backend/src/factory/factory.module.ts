import { Module } from '@nestjs/common';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FactoryController],
    providers: [FactoryService],
    exports: [FactoryService]
})
export class FactoryModule { }
