import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { DatabaseModule } from 'src/database.module'; 

@Module({
  imports: [DatabaseModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
