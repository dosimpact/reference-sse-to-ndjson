import { Controller, Post, Body, Res, Get, Sse } from '@nestjs/common';
import { Response } from 'express';
import { AnalyzeService } from './analyze.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { Observable, interval, map } from 'rxjs';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  async analyzeText(
    @Body() analyzeRequestDto: AnalyzeRequestDto,
    @Res() response: Response,
  ) {
    return this.analyzeService.analyzeText(analyzeRequestDto, response);
  }

  @Sse('events')
  sse(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => ({ data: { message: 'Hello from SSE!' } }) as MessageEvent),
    );
  }
}
