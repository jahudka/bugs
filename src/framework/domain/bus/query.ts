import { $resultType } from './types';

export interface Query<Result = unknown> {
  [$resultType]?: Result;
}
