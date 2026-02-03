import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';

@Module({
    imports: [PrismaModule, RealtimeModule],
    controllers: [ClientsController, ActivitiesController],
    providers: [ClientsService, ActivitiesService],
})
export class CrmModule { }
