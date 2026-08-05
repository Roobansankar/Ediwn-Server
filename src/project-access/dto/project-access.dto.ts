import { IsString, IsUUID, IsInt, Min, Max } from 'class-validator';

export class ApproveProjectAccessDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(3650)
  days: number;
}

export class RevokeProjectAccessDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  userId: string;
}
