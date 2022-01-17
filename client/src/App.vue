<template>
  <div v-if="activeGameId === null">
    <button @click="createGame">Create game</button>
    <hr />
    <div>
      <input type="text" id="gameIdInput" v-model="gameIdInput" v-on:keyup.enter="joinGame" />
      <button @click="joinGame" :disabled="!gameIdInput">Join game</button>
    </div>
  </div>
  <div v-if="activeGameId !== null" class="container">
    <div class="player-stats-column">
      <PlayerStats v-for="player in sortedPlayers.slice(0, 2)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
    </div>
    <Grid :game-id="activeGameId" :my-player-id="myPlayerId" :players="players" :tiles="tiles" :num-tiles-remaining-per-player="numTilesRemainingPerPlayer" :max-num-tiles-per-player="maxNumTilesPerPlayer" @tile-clicked="getTiles"/>
    <div class="player-stats-column">
      <PlayerStats v-for="player in sortedPlayers.slice(2, 4)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import Grid from './components/Grid.vue';
import PlayerStats from './components/PlayerStats.vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import _ from 'lodash';

export default defineComponent({
  name: 'App',
  components: {
    Grid,
    PlayerStats
  },
  data() {
    return {
      gameIdInput: null,
      activeGameId: null,
      playerName: null,
      players: [],
      tiles: [],
      maxNumTilesPerPlayer: 15,
      unsubscribeFromGame: null,
    };
  },
  mounted() {
  },
  methods: {
    async createGame() {
      if (!this.playerName) {
        this.promptForName();
      }

      if (!this.playerName) {
        alert('Invalid player name.');
        return;
      }

      const { playerName } = this;

      const functions = getFunctions();

      let result = null;
      try {
        result = await httpsCallable(functions, 'createGame')({ playerName })
      } catch (error) {
        alert('An unknown error occurred while creating a game.');
      }

      const { data } = result;
      const { gameId } = data;
      this.activeGameId = gameId;

      this.subscribeToGame(gameId);
    },
    async joinGame() {
      const gameId = this.gameIdInput;
      if (!gameId) {
        return;
      }

      if (!this.playerName) {
        this.promptForName();
      }

      if (!this.playerName) {
        alert('Invalid player name.');
        return;
      }

      const { playerName } = this;

      const functions = getFunctions();

      try {
        await httpsCallable(functions, 'joinGame')({ gameId, playerName });
      } catch (error) {
        const { code } = error;
        if (code === 'functions/not-found') {
          alert('Invalid game ID.');
        } else {
          alert('An unknown error occurred while joining the game.');
        }
        return;
      }

      this.activeGameId = gameId;
      this.gameIdInput = null;

      this.subscribeToGame(gameId);
    },
    subscribeToGame(gameId) {
      const db = getFirestore();

      if (this.unsubscribeFromGame) {
        this.unsubscribeFromGame();
      }
      this.unsubscribeFromGame = onSnapshot(doc(db, 'games', gameId), doc => {
        const game = doc.data();
        console.log(game);
        const colors = [
          'orange',
          'blue',
          'pink',
          'green',
        ];
        this.players = game.players.map(x => ({ ...x, color: colors[x.color] }));
        this.tiles = game.tiles;
      });
    },
    promptForName() {
      this.playerName = prompt('What is your name?');
    },
    findPlayer(id) {
      return _.find(this.players, value => value.id === id);
    },
    async getTiles() {
      console.log('TODO: Get tiles.');
      // const tilesResponse = await fetch('http://localhost:3000/tiles');
      // this.tiles = (await tilesResponse.json())['tiles'];
    },
    async getPlayers() {
      console.log('TODO: Get players.');
      // const playersResponse = await fetch('http://localhost:3000/players');
      // this.players = (await playersResponse.json())['players'];
    },
    async clearTiles() {
      console.log('TODO: Clear tiles.');
      // await fetch('http://localhost:3000/tiles', {
      //   method: 'delete'
      // });
      // await this.getTiles();
    },
    getNumTilesRemaining(playerId) {
      // This assumes that player 0 starts, and the players continue in order by ID.
      return Math.max(this.maxNumTilesPerPlayer - Math.floor(this.tiles.length / this.players.length) - (this.tiles.length % this.players.length > playerId ? 1 : 0), 0);
    }
  },
  computed: {
    myPlayerId() {
      return getAuth().currentUser.uid;
    },
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

    // // TODO: Set up web socket to track changes to the board and update the Grid's props
    // this.socket = new WebSocket('ws://localhost:3000');
    //
    // this.socket.addEventListener('open', () => {
    //   // Causes the server to print "Hello"
    //   this.socket.send('Hello');
    // });
  },
});
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
button:hover:not([disabled]) {
  background-color: darkgray;
  cursor: pointer;
}
</style>
