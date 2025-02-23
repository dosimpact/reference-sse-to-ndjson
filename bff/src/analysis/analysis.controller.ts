import { Controller, Post, Body } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisRequestDto } from './dto/analysis-request.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async analyzeText(@Body() analysisRequestDto: AnalysisRequestDto) {
    return this.analysisService.analyzeText(analysisRequestDto);
  }
}
