"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_ERRORS_BY_CODE = void 0;
const common_1 = require("@nestjs/common");
// This is the same list of HTTP errors as used by the NestJS ValidationPipe.
// https://github.com/nestjs/nest/blob/85b0dc84953802d33ae8753df02adb84d6d0f0e8/packages/common/utils/http-error-by-code.util.ts#L46
exports.HTTP_ERRORS_BY_CODE = {
    [common_1.HttpStatus.BAD_GATEWAY]: common_1.BadGatewayException,
    [common_1.HttpStatus.BAD_REQUEST]: common_1.BadRequestException,
    [common_1.HttpStatus.CONFLICT]: common_1.ConflictException,
    [common_1.HttpStatus.FORBIDDEN]: common_1.ForbiddenException,
    [common_1.HttpStatus.GATEWAY_TIMEOUT]: common_1.GatewayTimeoutException,
    [common_1.HttpStatus.GONE]: common_1.GoneException,
    [common_1.HttpStatus.I_AM_A_TEAPOT]: common_1.ImATeapotException,
    [common_1.HttpStatus.INTERNAL_SERVER_ERROR]: common_1.InternalServerErrorException,
    [common_1.HttpStatus.METHOD_NOT_ALLOWED]: common_1.MethodNotAllowedException,
    [common_1.HttpStatus.NOT_ACCEPTABLE]: common_1.NotAcceptableException,
    [common_1.HttpStatus.NOT_FOUND]: common_1.NotFoundException,
    [common_1.HttpStatus.NOT_IMPLEMENTED]: common_1.NotImplementedException,
    [common_1.HttpStatus.PAYLOAD_TOO_LARGE]: common_1.PayloadTooLargeException,
    [common_1.HttpStatus.PRECONDITION_FAILED]: common_1.PreconditionFailedException,
    [common_1.HttpStatus.REQUEST_TIMEOUT]: common_1.RequestTimeoutException,
    [common_1.HttpStatus.SERVICE_UNAVAILABLE]: common_1.ServiceUnavailableException,
    [common_1.HttpStatus.UNAUTHORIZED]: common_1.UnauthorizedException,
    [common_1.HttpStatus.UNPROCESSABLE_ENTITY]: common_1.UnprocessableEntityException,
    [common_1.HttpStatus.UNSUPPORTED_MEDIA_TYPE]: common_1.UnsupportedMediaTypeException,
};
//# sourceMappingURL=http-errors.js.map