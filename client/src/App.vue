<template>
  <button @click="clearTiles">Start new game</button>
  <div class="container">
    <div class="player-stats-column">
      <PlayerStats v-for="player in sortedPlayers.slice(0, 2)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
    </div>
    <Grid :my-player-id="0" :players="players" :tiles="tiles" :num-tiles-remaining-per-player="numTilesRemainingPerPlayer" :max-num-tiles-per-player="maxNumTilesPerPlayer" @tile-clicked="getTiles"/>
    <div class="player-stats-column">
      <PlayerStats v-for="player in sortedPlayers.slice(2, 4)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
    </div>
  </div>
</template>

<script>
import Grid from './components/Grid.vue';
import PlayerStats from './components/PlayerStats.vue';
import _ from 'lodash';

export default {
  name: 'App',
  components: {
    Grid,
    PlayerStats
  },
  data() {
    return {
      players: [],
      tiles: [],
      maxNumTilesPerPlayer: 15
    };
  },
  methods: {
    findPlayer(id) {
      return _.find(this.players, value => value.id === id);
    },
    async getTiles() {
      const tilesResponse = await fetch('http://localhost:3000/tiles');
      this.tiles = (await tilesResponse.json())['tiles'];
    },
    async getPlayers() {
      const playersResponse = await fetch('http://localhost:3000/players');
      this.players = (await playersResponse.json())['players'];
    },
    async clearTiles() {
      await fetch('http://localhost:3000/tiles', {
        method: 'delete'
      });
      await this.getTiles();
    },
    getNumTilesRemaining(playerId) {
      // This assumes that player 0 starts, and the players continue in order by ID.
      return Math.max(this.maxNumTilesPerPlayer - Math.floor(this.tiles.length / this.players.length) - (this.tiles.length % this.players.length > playerId ? 1 : 0), 0);
    }
  },
  computed: {
    sortedPlayers() {
      return _.sortBy(this.players, value => value.id);
    },
    numTilesRemainingPerPlayer() {
      return this.players.map(player => this.getNumTilesRemaining(player.id));
    }
  },
  async created() {
    await this.getTiles();
    await this.getPlayers();

    // TODO: Set up web socket to track changes to the board and update the Grid's props
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.container {
  display: flex;
  /*flex-direction: row;*/
}
.container > :not(.grid) {
  /*flex: 1;*/
}
.container > .grid {
  /*flex: 2;*/
  flex: 1;
}
.player-stats-column {
  /*display: flex;*/
  /*flex-direction: column;*/
}
.player-stats-column > * {
  /*flex: 1;*/
}
table {
  margin: 60px auto 0 auto;
}
button {
  background-color: lightgray;
  border: none;
  border-radius: 5px;
  padding: 10px;
}
button:hover {
  background-color: darkgray;
  cursor: pointer;
}
</style>
