<template>
  <div v-if="gameStatus === GameStatus.NONE">
    <el-button type="primary" @click="() => gameStatus = GameStatus.CREATING_GAME">Create game</el-button>
    <el-button type="primary" @click="() => gameStatus = GameStatus.JOINING_GAME">Join game</el-button>
  </div>
  <div v-else-if="gameStatus === GameStatus.CREATING_GAME">
    <el-form ref="createGameFormRef" :model="createGameForm" :rules="createGameFormRules" label-width="120px">
      <el-form-item label="Your name" prop="playerName">
        <el-input v-model="createGameForm.playerName"></el-input>
      </el-form-item>
      <el-form-item label="Players" prop="maxNumPlayers">
        <el-input-number v-model="createGameForm.maxNumPlayers" :min="2" :max="4" />
      </el-form-item>
      <el-form-item label="Invite only" prop="inviteOnly">
        <el-switch v-model="createGameForm.inviteOnly"></el-switch>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="createGame">Create game</el-button>
        <el-button @click="() => gameStatus = GameStatus.NONE">Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div v-else-if="gameStatus === GameStatus.JOINING_GAME">
    <el-form ref="joinGameFormRef" :model="joinGameForm" :rules="joinGameFormRules" label-width="120px">
      <el-form-item label="Your name" prop="playerName">
        <el-input v-model="joinGameForm.playerName"></el-input>
      </el-form-item>
      <el-form-item label="Game ID" prop="gameId">
        <el-input v-model="joinGameForm.gameId"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="joinGame">Join game</el-button>
        <el-button @click="() => gameStatus = GameStatus.NONE">Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div v-else-if="gameStatus === GameStatus.WAITING_FOR_GAME_TO_START">
    <p>Game ID: {{ activeGameId }}</p>
    <p>Players:</p>
    <p v-for="player in players" :key="player.id">{{ player.name }}</p>
    <el-button v-if="players[0].id === myPlayerId" type="primary" @click="startGame">Start game</el-button>
    <p v-else>Waiting for {{ players[0].name }} to start the game...</p>
  </div>
  <div v-else-if="activeGameId !== null" class="container">
    <div class="player-stats-column">
      <PlayerStats v-for="player in sortedPlayers.slice(0, 2)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
    </div>
    <Grid :game-id="activeGameId" :my-player-id="myPlayerId" :players="players" :tiles="tiles" :num-tiles-remaining-per-player="numTilesRemainingPerPlayer" :max-num-tiles-per-player="maxNumTilesPerPlayer" @tile-clicked="getTiles"/>
    <div class="player-stats-column">
      <PlayerStats v-for="player in sortedPlayers.slice(2, 4)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
    </div>
  </div>
</template>

<script setup>
import 'element-plus/es/components/message/style/css'
</script>

<script>
import { defineComponent, reactive } from 'vue';
import Grid from './components/Grid.vue';
import PlayerStats from './components/PlayerStats.vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import _ from 'lodash';
import { ElMessage } from 'element-plus'

const GameStatus = {
  NONE: 0,
  CREATING_GAME: 1,
  JOINING_GAME: 2,
  WAITING_FOR_GAME_TO_START: 3,
  IN_PROGRESS: 4,
}

export default defineComponent({
  name: 'App',
  components: {
    Grid,
    PlayerStats
  },
  data() {
    return {
      createGameForm: reactive({
        playerName: '',
        maxNumPlayers: 2,
        inviteOnly: false,
      }),
      createGameFormRules: reactive({
        playerName: {
          required: true,
          message: 'Please enter your name',
          trigger: 'blur',
        },
      }),
      joinGameForm: reactive({
        playerName: '',
        gameId: '',
      }),
      joinGameFormRules: reactive({
        playerName: {
          required: true,
          message: 'Please enter your name',
          trigger: 'blur',
        },
        gameId: {
          required: true,
          message: 'Please enter a valid game ID',
          trigger: 'blur',
        },
      }),
      gameStatus: GameStatus.NONE,
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
      if (!await this.$refs['createGameFormRef'].validate()) {
        return;
      }

      const { playerName, maxNumPlayers, inviteOnly } = this.createGameForm;

      const functions = getFunctions();

      let result = null;
      try {
        result = await httpsCallable(functions, 'createGame')({ playerName, maxNumPlayers, inviteOnly })
      } catch (error) {
        ElMessage({
          showClose: true,
          message: 'An unknown error occurred while creating the game.',
          type: 'error',
        });
      }

      const { data } = result;
      const { gameId } = data;
      this.activeGameId = gameId;

      this.gameStatus = GameStatus.WAITING_FOR_GAME_TO_START;

      this.subscribeToGame(gameId);
    },
    async joinGame() {
      if (!await this.$refs['joinGameFormRef'].validate()) {
        return;
      }

      const { playerName, gameId } = this.joinGameForm;

      const functions = getFunctions();

      try {
        await httpsCallable(functions, 'joinGame')({ gameId, playerName });
      } catch (error) {
        const { code } = error;
        if (code === 'functions/not-found') {
          ElMessage({
            showClose: true,
            message: 'Invalid game ID.',
            type: 'error',
          });
        } else {
          ElMessage({
            showClose: true,
            message: 'An unknown error occurred while joining the game.',
            type: 'error',
          });
        }
        return;
      }

      this.activeGameId = gameId;

      this.gameStatus = GameStatus.WAITING_FOR_GAME_TO_START;

      this.subscribeToGame(gameId);
    },
    async startGame() {
      const functions = getFunctions();

      try {
        await httpsCallable(functions, 'startGame')({ gameId: this.activeGameId });
      } catch (error) {
        const { code } = error;
        if (code === 'functions/not-found') {
          ElMessage({
            showClose: true,
            message: 'Invalid game ID.',
            type: 'error',
          });
        } else {
          ElMessage({
            showClose: true,
            message: 'An unknown error occurred while starting the game.',
            type: 'error',
          });
        }
      }
    },
    subscribeToGame(gameId) {
      const db = getFirestore();

      if (this.unsubscribeFromGame) {
        this.unsubscribeFromGame();
      }
      this.unsubscribeFromGame = onSnapshot(doc(db, 'games', gameId), doc => {
        const game = doc.data();
        const colors = [
          'orange',
          'blue',
          'pink',
          'green',
        ];
        this.players = game.players.map(x => ({ ...x, color: colors[x.color] }));
        this.tiles = game.tiles;

        if (game.started) {
          this.gameStatus = GameStatus.IN_PROGRESS;
        }
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
  /*background-color: darkgray;*/
  cursor: pointer;
}
</style>
