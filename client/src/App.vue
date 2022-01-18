<template>
  <el-container>
    <el-main v-if="gameStatus === GameStatus.CREATING_GAME">
      <el-row justify="center">
        <el-col :xs="24" :sm="20" :md="16" :lg="12" :xl="8">
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
        </el-col>
      </el-row>
    </el-main>
    <el-main v-else-if="gameStatus === GameStatus.JOINING_GAME">
      <el-row justify="center">
        <el-col :xs="24" :sm="20" :md="16" :lg="12" :xl="8">
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
        </el-col>
      </el-row>
    </el-main>
    <el-main v-else-if="gameStatus === GameStatus.WAITING_FOR_GAME_TO_START">
      <p>
        Game ID: {{ activeGameId }}
        <el-button :icon="recentlyCopiedToClipboard ? Check : CopyDocument" circle @click="copyActiveGameIdToClipboard" @blur="recentlyCopiedToClipboard = false"></el-button>
      </p>
      <p>Players:</p>
      <p v-for="player in players" :key="player.id">{{ player.name }}</p>
      <el-button v-if="players.length > 0 && players[0].id === myPlayerId" type="primary" :disabled="players.length < 2" @click="startGame">Start game</el-button>
      <p v-else-if="players.length > 0">Waiting for {{ players[0].name }} to start the game...</p>
    </el-main>
    <el-main v-else>
      <el-row v-if="gameStatus === GameStatus.NONE || activeGameId && playerWinnerId" justify="center">
        <el-space spacer="|">
          <el-button type="primary" @click="() => { reset(); gameStatus = GameStatus.CREATING_GAME; }">Create game</el-button>
          <el-button type="primary" @click="() => { reset(); gameStatus = GameStatus.JOINING_GAME; }">Join game</el-button>
        </el-space>
      </el-row>
      <el-row v-if="playerWinnerId">
        <el-col justify="center">
          <h1 :style="{ 'color': players.find(x => x.id === playerWinnerId).color }">{{ players.find(x => x.id === playerWinnerId).name }} won!</h1>
        </el-col>
      </el-row>
      <el-row v-if="activeGameId">
        <div class="player-stats-column">
          <PlayerStats v-for="player in sortedPlayers.slice(0, 2)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
        </div>
        <Grid :game-id="activeGameId" :my-player-id="myPlayerId" :players="players" :tiles="tiles" :num-tiles-added="numTilesAdded" :num-tiles-remaining-per-player="numTilesRemainingPerPlayer" :max-num-tiles-per-player="maxNumTilesPerPlayer" :game-over="!!playerWinnerId" style="flex: 1;" />
        <div class="player-stats-column">
          <PlayerStats v-for="player in sortedPlayers.slice(2, 4)" :key="player.id" :id="player.id" :name="player.name" :color="player.color" :num-tiles-remaining="getNumTilesRemaining(player.id)"></PlayerStats>
        </div>
      </el-row>
    </el-main>
  </el-container>
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
import { Check, CopyDocument } from '@element-plus/icons-vue';

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
      recentlyCopiedToClipboard: false,
      gameStatus: GameStatus.NONE,
      activeGameId: null,
      playerName: null,
      players: [],
      tiles: [],
      numTilesAdded: 0,
      playerWinnerId: null,
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
        const prevNumTiles = this.tiles.length;
        this.tiles = game.tiles;
        this.numTilesAdded = game.numTilesAdded;

        if (game.started) {
          this.gameStatus = GameStatus.IN_PROGRESS;
        }

        if (this.tiles.length > prevNumTiles) {
          if (this.checkForWin()) {
            this.playerWinnerId = this.tiles[this.tiles.length - 1].playerId;
            console.log(`Player ${this.players.find(x => x.id === this.playerWinnerId).name} won the game.`);
          }
        }
      });
    },
    checkForWin() {
      // Assumes that the newest tile is the last tile in the list.
      const newTile = this.tiles[this.tiles.length - 1];
      const tilesToCheck = this.tiles.filter(x => x.playerId === newTile.playerId);
      const tilesInSameRow = [];
      const tilesInSameColumn = [];
      const tilesInSameNegativeSlopeDiagonal = [];
      const tilesInSamePositiveSlopeDiagonal = [];
      for (const tile of tilesToCheck) {
        if (tile.x === newTile.x && tile.y === newTile.y) {
          continue;
        } else if (tile.y === newTile.y) {
          tilesInSameRow.push(tile);
        } else if (tile.x === newTile.x) {
          tilesInSameColumn.push(tile);
        } else if (tile.x - newTile.x === tile.y - newTile.y) {
          tilesInSamePositiveSlopeDiagonal.push(tile);
        } else if (tile.x - newTile.x === newTile.y - tile.y) {
          tilesInSameNegativeSlopeDiagonal.push(tile);
        }
      }

      tilesInSameRow.push(newTile);
      tilesInSameColumn.push(newTile);
      tilesInSameNegativeSlopeDiagonal.push(newTile);
      tilesInSamePositiveSlopeDiagonal.push(newTile);

      tilesInSameRow.sort((a, b) => a.x - b.x);
      tilesInSameColumn.sort((a, b) => a.y - b.y);
      tilesInSameNegativeSlopeDiagonal.sort((a, b) => a.x - b.x);
      tilesInSamePositiveSlopeDiagonal.sort((a, b) => a.x - b.x);

      return this.checkConsecutiveTileCount(newTile, tilesInSameRow, (a, b) => a.x + 1 === b.x) ||
        this.checkConsecutiveTileCount(newTile, tilesInSameColumn, (a, b) => a.y + 1 === b.y) ||
        this.checkConsecutiveTileCount(newTile, tilesInSameNegativeSlopeDiagonal, (a, b) => a.x + 1 === b.x && a.y - 1 === b.y) ||
        this.checkConsecutiveTileCount(newTile, tilesInSamePositiveSlopeDiagonal, (a, b) => a.x + 1 === b.x && a.y + 1 === b.y);
    },
    checkConsecutiveTileCount(newTile, tiles, consecutivePredicate) {
      let consecutiveTileCount = 0;
      let previousTile = null;
      let containsNewTile = false;
      for (const tile of tiles) {
        if (!previousTile || !consecutivePredicate(previousTile, tile)) {
          consecutiveTileCount = 1;
          containsNewTile = tile.x === newTile.x && tile.y === newTile.y;
        } else {
          consecutiveTileCount++;
          containsNewTile |= tile.x === newTile.x && tile.y === newTile.y;
          if (consecutiveTileCount >= 5 && containsNewTile) {
            return true;
          }
        }
        previousTile = tile;
      }
      return false;
    },
    reset() {
      if (this.unsubscribeFromGame) {
        this.unsubscribeFromGame();
      }
      this.createGameForm.maxNumPlayers = 2;
      this.createGameForm.inviteOnly = false;
      this.joinGameForm.gameId = '';
      this.recentlyCopiedToClipboard = false;
      this.activeGameId = null;
      this.players = [];
      this.tiles = [];
      this.numTilesAdded = 0;
      this.playerWinnerId = null;
    },
    copyActiveGameIdToClipboard() {
      navigator.clipboard.writeText(this.activeGameId)
        .then(() => this.recentlyCopiedToClipboard = true)
        .catch(e => console.error(e));
    },
    getNumTilesRemaining(playerId) {
      // This assumes that player 0 starts, and the players continue in order by ID.
      if (this.tiles.length === this.players.length * this.maxNumTilesPerPlayer) {
        return 0;
      } else if (this.tiles.length + 1 === this.players.length * this.maxNumTilesPerPlayer) {
        return this.players[this.numTilesAdded % this.players.length].id === playerId ? 1 : 0;
      } else {
        const playerIndex = this.players.findIndex(x => x.id === playerId);
        return this.maxNumTilesPerPlayer - Math.floor(this.tiles.length / this.players.length) - (this.tiles.length % this.players.length > playerIndex ? 1 : 0);
      }
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
