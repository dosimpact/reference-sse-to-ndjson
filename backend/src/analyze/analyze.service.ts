import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name);
  private readonly errorRate: number;

  constructor() {
    // 환경 변수에서 에러 발생 확률을 가져오거나 기본값 10% 사용
    this.errorRate = Number(process.env.ERROR_RATE) || 0.001;
    this.logger.log(`Error simulation rate set to ${this.errorRate * 100}%`);
  }

  private simulateRandomError(): boolean {
    return Math.random() < this.errorRate;
  }

  private getRandomError(): { message: string; code: string } {
    const errors = [
      { message: '서버 과부하로 인한 처리 지연', code: 'SERVER_OVERLOAD' },
      { message: '텍스트 분석 모델 로딩 실패', code: 'MODEL_LOAD_FAILED' },
      { message: '메모리 부족으로 인한 처리 중단', code: 'OUT_OF_MEMORY' },
      { message: '네트워크 연결 불안정', code: 'NETWORK_UNSTABLE' },
      { message: '분석 모델 예외 발생', code: 'MODEL_EXCEPTION' },
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  async analyzeText(dto: AnalyzeRequestDto, response: Response) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    // 분석 결과를 시뮬레이션하는 예시 데이터
    const sampleResponses = [
      '분석을 시작합니다...',
      '텍스트를 처리하는 중입니다...',
      '주요 키워드를 추출하고 있습니다...',
      '감성 분석을 수행하고 있습니다...',
      '최종 결과를 생성합니다...',
      '분석이 완료되었습니다.',
    ];

    try {
      for (const message of sampleResponses) {
        // 각 단계마다 에러 발생 가능성 체크
        if (this.simulateRandomError()) {
          const error = this.getRandomError();
          this.logger.error(`Analysis error: ${error.message} (${error.code})`);
          response.write(
            `event: error\ndata: ${JSON.stringify({
              error: error.message,
              code: error.code,
              timestamp: new Date().toISOString(),
            })}\n\n`,
          );
          response.end();
          return;
        }

        response.write(
          `data: ${JSON.stringify({
            message,
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 간격으로 메시지 전송
      }

      response.write('event: done\ndata: {}\n\n'); // 완료 이벤트 전송
    } catch (error) {
      this.logger.error('Unexpected error:', error);
      response.write(
        `event: error\ndata: ${JSON.stringify({
          error: '분석 중 예기치 않은 오류가 발생했습니다.',
          code: 'UNEXPECTED_ERROR',
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );
    } finally {
      response.end();
    }
  }
}
