import { createParamDecorator } from '@nestjs/common';
import { UserPayloadRequest } from '@common/interfaces/auth-request.interface';


export const User = createParamDecorator(
    (_data, ctx) => ctx.switchToHttp().getRequest<UserPayloadRequest>().user ?? null
);
