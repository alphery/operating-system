import { Controller, Post, Body } from '@nestjs/common';

@Controller('admin')
export class AdminController {
    @Post('debug-login')
    async debugLogin(@Body() body: any) {
        return {
            received: body,
            customUidType: typeof body.customUid,
            customUidLength: body.customUid?.length,
            customUidValue: body.customUid,
            passwordType: typeof body.password,
            passwordLength: body.password?.length,
            passwordValue: body.password,
            passwordCharCodes: body.password?.split('').map((c: string) => c.charCodeAt(0))
        };
    }
}
