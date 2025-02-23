import { Injectable } from '@nestjs/common';
import { AnalysisRequestDto } from './dto/analysis-request.dto';

@Injectable()
export class AnalysisService {
  async analyzeText(dto: AnalysisRequestDto) {
    try {
      // TODO: 실제 백엔드 서버로 요청을 전달하는 로직 구현
      const response = await fetch('http://localhost:3002/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: dto.text }),
      });

      if (!response.ok) {
        throw new Error('Backend server error');
      }

      return await response.json();
    } catch (error) {
      throw new Error('분석 처리 중 오류가 발생했습니다.');
    }
  }
}
