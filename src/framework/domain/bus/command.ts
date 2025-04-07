import { $resultType } from './types';

export interface Command<Result = any> {
  [$resultType]?: Result;
}
