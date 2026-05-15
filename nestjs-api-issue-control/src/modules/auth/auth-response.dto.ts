import { UserResponseDto } from '../users/dto/user-response.dto';

export class AuthResponseDto {
  status: string;
  message: string;
  data: UserResponseDto;
}