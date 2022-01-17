import { Color } from './color';

export class Player {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly color: Color) {
  }
}