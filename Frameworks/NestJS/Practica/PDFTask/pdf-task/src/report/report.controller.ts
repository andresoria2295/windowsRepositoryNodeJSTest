import { Controller, Get, Res, Body, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { Response } from 'express';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('user')
  async getUserReport(@Res() res: Response) {
    try {
      const report = await this.reportService.getUserReport();
      res.status(200).json(report);
    } catch (error) {
      console.error('Error detallado en getUserReport:', error);
      res.status(500).json({ message: 'Error al generar el reporte' });
    }
  }

  @Post('user')
  async createUser(@Body() newUserData: any, @Res() res: Response) {
    try {
      await this.reportService.createUser(newUserData);
      res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
  }
}
