import { Module, Global } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantGuard } from './tenant.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantController } from './tenant.controller'; // Added this import

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [TenantController],
    providers: [TenantService, TenantGuard],
    exports: [TenantService, TenantGuard],
})
export class TenantModule { }
