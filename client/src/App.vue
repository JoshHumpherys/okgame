<template>
  <button @click="clearTiles">Start new game</button>
  <Grid :my-player-id="tiles.length % players.length" :players="players" :tiles="tiles" @tile-added="getTiles"/>
</template>

<script>
import Grid from './components/Grid.vue'

export default {
  name: 'App',
  components: {
    Grid
  },
  data() {
    return {
      players: [],
      tiles: []
    };
  },
  methods: {
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
