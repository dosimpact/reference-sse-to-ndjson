import { IsString, IsNotEmpty } from 'class-validator';

export class AnalysisRequestDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
