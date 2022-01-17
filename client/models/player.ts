import { Color } from './color';

export class Player {
  constructor(
    readonly id: number,
    readonly name: string,
    readonly color: Color) {
  }
}