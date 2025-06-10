import { Request } from 'express';

declare module 'express' {
  interface Request {
    ws?: any;
  }
}