import { Module } from "@nestjs/common";
import { LockersController } from "./lockers.controller";

@Module({ controllers: [LockersController] })
export class LockersModule {}