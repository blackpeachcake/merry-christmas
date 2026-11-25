// passport-kakao 공식 타입이 없어 최소 선언
declare module 'passport-kakao' {
  import { Strategy as PassportStrategy } from 'passport';
  export interface KakaoStrategyOptions {
    clientID: string;
    clientSecret?: string;
    callbackURL: string;
  }
  export class Strategy extends PassportStrategy {
    constructor(
      options: KakaoStrategyOptions,
      verify: (...args: any[]) => any,
    );
    name: string;
  }
}
