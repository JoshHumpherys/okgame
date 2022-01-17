import { Player } from './player';
import { Tile } from './tile';

export class Game {
  constructor(
    readonly id: string,
    readonly players: Player[],
    readonly tiles: Tile[]) {
  }
}