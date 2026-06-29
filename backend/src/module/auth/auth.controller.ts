import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { MESSAGES } from '@common/constants';
import { ErrorResponseDto } from '@common/schemas/error-response.schema';
import { ApiOperation, ApiExtraModels, ApiCreatedResponse, getSchemaPath, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';
import { LoginDto, LoginResponseDto, LoginSchema, LogoutResponseDto, RefreshResponseDto } from './auth.schema';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { JwtRefreshAuthGuard } from '@common/guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from '@common/guards/local-auth.guard';
import { UserPayloadRequest } from '@common/interfaces/auth-request.interface';

@Controller({
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) { }


  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Вход в систему',
    description:
      'Позволяет авторизоваться в системе, получить JWT-токен и данные пользователя.',
  })
  @ApiExtraModels(LoginResponseDto)
  @ApiCreatedResponse({
    description: MESSAGES.LOGIN_SUCCESS,
    schema: { $ref: getSchemaPath(LoginResponseDto) },
  })
  @ApiUnauthorizedResponse({
    description: MESSAGES.AUTH_FAILED,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Req() req: UserPayloadRequest,
    @Body(new ZodValidationPipe(LoginSchema)) _loginUserDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LoginResponseDto> {
    const currentUser = req.user;

    const { tokens, errors: loginErrors } = await this.authService.login(currentUser, req, reply);

    if (loginErrors.length > 0 || !tokens) {
      throw new UnauthorizedException(
        loginErrors.length > 0 ? loginErrors : [MESSAGES.AUTH_FAILED],
      );
    }

    return {
      message: MESSAGES.LOGIN_SUCCESS,
      user: currentUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Выход из системы',
    description: 'Удаляет куки клиента (на фронте) и завершает сессию.',
  })
  @ApiExtraModels(LogoutResponseDto)
  @ApiCreatedResponse({
    description: MESSAGES.LOGOUT_SUCCESS,
    schema: { $ref: getSchemaPath(LogoutResponseDto) },
  })
  @ApiUnauthorizedResponse({
    description: MESSAGES.AUTH_FAILED,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @Throttle({
    default: { limit: 10, ttl: 60000 },
    short: { limit: 3, ttl: 5000 }
  })
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: UserPayloadRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LogoutResponseDto> {
    const { errors } = await this.authService.logout(req, reply);

    if (errors.length > 0) {
      throw new UnauthorizedException(errors);
    }

    return { message: MESSAGES.LOGOUT_SUCCESS };
  }

  @Post('token')
  @ApiOperation({
    summary: 'Обновление токенов',
    description:
      'Обновляет access и refresh токены с использованием текущего токена обновления. ' +
      'При успешной ротации возвращает новую пару токенов. Токен обновления должен быть ' +
      'предоставлен в cookies или заголовке Authorization.',
  })
  @ApiExtraModels(RefreshResponseDto)
  @ApiCreatedResponse({
    description: MESSAGES.UPDATED_SUCCESSFULLY,
    schema: { $ref: getSchemaPath(RefreshResponseDto) },
  })
  @Throttle({
    default: { limit: 30, ttl: 60000 }, // 30 попыток в минуту (нормальное использование)
    short: { limit: 10, ttl: 10000 } // 10 попыток за 10 секунд (защита от брутфорса)
  })
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @Req() req: UserPayloadRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<RefreshResponseDto> {
    const currentUser = req.user;
    const refreshToken = req.cookies?.Refresh;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token не найден');
    }

    const { tokens, errors } = await this.authService.login(currentUser, req, reply, true);

    if (errors.length > 0 || !tokens) {
      throw new UnauthorizedException(errors);
    }

    return {
      message: MESSAGES.UPDATED_SUCCESSFULLY,
      user: currentUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }
}
