<template>
  <div class="grid">
    <table>
      <tr v-for="i in yIndices" :key="i">
        <td v-for="j in xIndices" :key="j" @mouseover="onTileMouseOver(j, i)" @mouseleave="onTileMouseLeave(j, i)" @mouseup="onTileMouseUp(j, i)" :class="isHoveredTile(j, i) && isPlayableTile(j, i) ? 'tile-hovered-and-playable' : ''" :style="getTileStyle(j, i)"></td>
      </tr>
    </table>
  </div>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'Grid',
  props: {
    myPlayerId: Number,
    players: Array,
    tiles: Array
  },
  data() {
    return {
      minNumCols: 11,
      minNumRows: 11,
      hoveredTiles: {},
      tileStyles: {}
    };
  },
  methods: {
    onTileMouseOver(x, y) {
      this.hoveredTiles[this.getTileId(x, y)] = true;
    },
    onTileMouseLeave(x, y) {
      this.hoveredTiles[this.getTileId(x, y)] = false;
    },
    async onTileMouseUp(x, y) {
      // console.log('x: ' + x + ', y: ' + y);
      if (this.isPlayableTile(x, y)) {
        await fetch('http://localhost:3000/tiles', {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: JSON.stringify({
            x,
            y,
            player: this.myPlayerId // TODO: Don't pass player ID in body
          })
        });
        // this.tiles = (await tilesResponse.json())['tiles'];
        // console.log(await postTilesResponse.json());
        
        this.$emit('tile-added');
        // const tilesResponse = await fetch('http://localhost:3000/tiles');
        // this.tiles.splice(0, this.tiles.length).push((await tilesResponse.json())['tiles']);
      }
    },
    getTileStyle(x, y) {
      const styles = [];
      let tileBackgroundColor = '#f9f9f9';
      const tile = this.findTile(x, y);
      if (tile) {
        tileBackgroundColor = _.find(this.players, value => value.id === tile.player).color;
      } else if (this.isPlayableTile(x, y)) {
        if (this.isHoveredTile(x, y)) {
          tileBackgroundColor = this.myColor;
        } else {
          // tileBackgroundColor = 'lightgray'
          styles.push('border: 2px dashed lightgray')
        }
      }
      // return [
      //   '--tile-bg-color: ' + this.getTileColor(x, y),
      //   '--tile-hovered-and-playable-bg-color: ' + this.myColor,
      // ].join(';');
      styles.push('--tile-bg-color: ' + tileBackgroundColor);
      return styles.join(';');
    },
    getTileColor(x, y) {
      const tile = this.findTile(x, y);
      if (tile) {
        return _.find(this.players, value => value.id === tile.player).color;
      } else {
        return 'lightgray';
      }
    },
    isHoveredTile(x, y) {
      return this.hoveredTiles[this.getTileId(x, y)] === true;
    },
    isPlayableTile(x, y) {
      return this.tiles.length === 0 || !this.findTile(x, y) && (this.findTile(x - 1, y) || this.findTile(x + 1, y) || this.findTile(x, y - 1) || this.findTile(x, y + 1));
    },
    findTile(x, y) {
      return _.find(this.tiles, value => value.x === x && value.y === y);
    },
    getTileId(x, y) {
      return `${x}_${y}`;
    }
  },
  computed: {
    myColor() {
      return _.find(this.players, x => x.id === this.myPlayerId).color;
    },
    xIndices() {
      // TODO: Dynamically select board size
      // console.log(_.find(this.tiles, x => x.x === 0 && x.y === 0));
      // return _.range(-5, 6);
      if (this.tiles.length === 0) {
        return [0];
      }
      const minXIndex = _.minBy(this.tiles, tile => tile.x).x;
      const maxXIndex = _.maxBy(this.tiles, tile => tile.x).x;
      return _.range(minXIndex - 1, maxXIndex + 1 + 1);
      // if (this.tiles.length === 0) {
      //   const halfMinNumCols = Math.floor(this.minNumCols / 2);
      //   return _.range(-halfMinNumCols, halfMinNumCols + ((this.minNumCols % 2 === 0) ? 0 : 1));
      // }
      // const minXIndex = _.minBy(this.tiles, x => x.x).x;
      // const maxXIndex = _.maxBy(this.tiles, x => x.x).x;
      // const numCols = maxXIndex - minXIndex + 1;
      // const numMissingCols = Math.max(this.minNumCols - numCols, 0);
      // return _.range(minXIndex, maxXIndex + numMissingCols + 1);
    },
    yIndices() {
      if (this.tiles.length === 0) {
        return [0];
      }
      const minYIndex = _.minBy(this.tiles, tile => tile.y).y;
      const maxYIndex = _.maxBy(this.tiles, tile => tile.y).y;
      return _.range(minYIndex - 1, maxYIndex + 1 + 1);
    }
    // },
    // cssProps() {
    //   // console.log(this.players[this.myPlayer]);
    //   return {
    //     '--tile-hover-bg-color': this.players[this.myPlayer]
    //   }
    // }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
table {
  border-spacing: 8px;
}
td {
  width: 80px;
  height: 80px;
  background-color: var(--tile-bg-color);
  border-radius: 5px;
  box-sizing: border-box;
}
td.tile-hovered-and-playable {
  /*border: 2px solid darkgray;*/
  cursor: pointer;
  opacity: 0.5;
}
</style>
