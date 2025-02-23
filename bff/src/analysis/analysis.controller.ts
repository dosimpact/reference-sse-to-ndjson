import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AnalysisService } from './analysis.service';
import { AnalysisRequestDto } from './dto/analysis-request.dto';
import { pipeDataStreamToResponse } from 'ai';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async analyzeText(
    @Body() analysisRequestDto: AnalysisRequestDto,
    @Res() response: Response,
  ) {
    return this.analysisService.analyzeText(analysisRequestDto, response);
  }
}
