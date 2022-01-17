import { Player } from './player';

export class Game {
  constructor(
    readonly id: string,
    readonly players: Player[]) {
  }
}