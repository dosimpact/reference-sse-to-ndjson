import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeRequestDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
