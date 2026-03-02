import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { MeController } from "./me/me.controller";
import { LockersModule } from "./lockers/lockers.module";
import { UsersModule } from "./users/users.module";
import { AllocationsModule } from "./allocations/allocations.module";
import { AuditModule } from "./audit/audit.module";
import { ReportsModule } from "./reports/reports.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SettingsModule } from "./settings/settings.module";
import { MaintenanceModule} from "./maintenance/maintenance.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LockersModule,
    UsersModule,
    AllocationsModule,
    AuditModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
    SettingsModule,
    MaintenanceModule
  ],
  controllers: [MeController],
})
export class AppModule {}