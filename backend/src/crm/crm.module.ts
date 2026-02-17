import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { CRMController } from './crm.controller';
import { CRMTemplatesService } from './templates.service';
import { CRMRecordsService } from './records.service';

@Module({
    imports: [PrismaModule, RealtimeModule],
    controllers: [ClientsController, ActivitiesController, CRMController],
    providers: [ClientsService, ActivitiesService, CRMTemplatesService, CRMRecordsService],
    exports: [CRMTemplatesService, CRMRecordsService],
})
export class CrmModule { }
