import { FastifyRequest } from 'fastify';
import { UserPayload } from './user-payload.interface';

export interface ActivityLogRequest extends FastifyRequest {
  user?: UserPayload;
  params: {
    id?: string;
    entityType?: string;
  };
}
