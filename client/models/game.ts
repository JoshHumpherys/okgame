import { Player } from './player';
import { Tile } from './tile';

export class Game {
  constructor(
    readonly id: string,
    readonly maxNumPlayers: number,
    readonly inviteOnly: boolean,
    readonly started: boolean,
    readonly players: Player[],
    readonly tiles: Tile[],
    readonly numTilesAdded: number) {
  }
}