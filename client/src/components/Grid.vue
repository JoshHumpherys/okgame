<template>
  <div class="grid">
    <table>
      <tr v-for="i in yIndices" :key="i">
        <Tile
            v-for="j in xIndices"
            :key="j + '_' + i"
            @tile-clicked="onTileClicked(j, i)"
            :tile-color="findPlayerById(findTile(j, i)?.playerId)?.color"
            :hover-color="this.players[this.playerTurn]?.id === myPlayerId ? myColor : null"
            :is-playable="isPlayableTile(j, i)"
            :is-selectable="isPlayableTile(j, i) && this.players[this.playerTurn]?.id === myPlayerId && !isPlayerRemoving"
            :is-removable="findPlayerById(findTile(j, i)?.playerId)?.color === myColor && this.players[this.playerTurn]?.id === myPlayerId && isPlayerRemoving"></Tile>
      </tr>
    </table>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import _ from 'lodash';
import Tile from './Tile';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default defineComponent({
  name: 'Grid',
  components: {
    Tile
  },
  props: {
    gameId: String,
    myPlayerId: String,
    players: Array,
    tiles: Array,
    maxNumTilesPerPlayer: Number,
    numTilesRemainingPerPlayer: Array,
  },
  data() {
    return {
      removedTile: null,
    };
  },
  methods: {
    isPlayableTile(x, y) {
      return this.tiles.length === 0 ||
          !this.findTile(x, y) &&
          (!!this.findTile(x - 1, y) || !!this.findTile(x + 1, y) || !!this.findTile(x, y - 1) || !!this.findTile(x, y + 1)) &&
          (!this.removedTile || this.removedTile.x !== x && this.removedTile.y !== y);
    },
    // isSelectableTile(x, y) {
    //   return this.tiles.length === 0 ||
    //       !this.findTile(x, y) &&
    //       (!!this.findTile(x - 1, y) || !!this.findTile(x + 1, y) || !!this.findTile(x, y - 1) || !!this.findTile(x, y + 1)) &&
    //       (!this.removedTile || this.removedTile.x === x && this.removedTile.y === y);
    // },
    // isRemovableTile(x, y) {
    //   return this.isPlayerRemoving
    // },
    findTile(x, y) {
      return _.find(this.tiles, value => value.x === x && value.y === y);
    },
    findPlayerById(playerId) {
      return _.find(this.players, value => value.id === playerId);
    },
    async onTileClicked(x, y) {
      if (this.isPlayerRemoving) {
        this.removedTile = this.findTile(x, y);

        console.log('TODO: Delete tile.');
        // await fetch('http://localhost:3000/tiles', {
        //   method: 'delete',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     x,
        //     y
        //   })
        // });

        this.$emit('tile-clicked');
      } else if (this.isPlayableTile(x, y)) {
        this.removedTile = null;

        const functions = getFunctions();

        try {
          await httpsCallable(functions, 'addTile')({ gameId: this.gameId, x, y });
        } catch (error) {
          const { code } = error;
          if (code === 'functions/not-found') {
            alert('Invalid game ID.');
          } else {
            alert('An unknown error occurred while placing the tile.');
          }
          return;
        }

        this.$emit('tile-clicked');
      }
    },
  },
  computed: {
    playerTurn() {
      return (this.tiles.length + (this.removedTile ? 1 : 0)) % this.players.length;
    },
    // colorsByPlayerId() {
    //   return new Map(this.players.map(x => ([x.id, x.color])));
    // },
    myColor() {
      const myPlayer = _.find(this.players, x => x.id === this.myPlayerId);
      return myPlayer?.color;
    },
    isPlayerRemoving() {
      return this.tiles.length >= this.players.length * this.maxNumTilesPerPlayer;
    },
    xIndices() {
      if (this.tiles.length === 0) {
        return [0];
      }
      const minXIndex = _.minBy(this.tiles, tile => tile.x).x;
      const maxXIndex = _.maxBy(this.tiles, tile => tile.x).x;
      return _.range(minXIndex - 1, maxXIndex + 1 + 1);
    },
    yIndices() {
      if (this.tiles.length === 0) {
        return [0];
      }
      const minYIndex = _.minBy(this.tiles, tile => tile.y).y;
      const maxYIndex = _.maxBy(this.tiles, tile => tile.y).y;
      return _.range(minYIndex - 1, maxYIndex + 1 + 1);
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
table {
  border-spacing: 8px;
}
</style>
