import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [PrismaModule, RealtimeModule],
    controllers: [ClientsController],
    providers: [ClientsService],
})
export class CrmModule { }
