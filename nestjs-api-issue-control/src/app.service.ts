import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Connect Backend Success! \n port: 3000';
  }
}
