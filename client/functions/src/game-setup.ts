import { https, logger } from 'firebase-functions';
import { gameConverter } from '../../converters/gameConverter';
import { firestore } from 'firebase-admin';
import { randomBytes } from 'crypto';
import { db } from './db';
import { Game } from '../../models/game';
import { Player } from '../../models/player';

export const createGame = https.onCall((data, context) => {
  const { playerName, maxNumPlayers, inviteOnly } = data;
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'User is not authenticated.');
  }
  const { uid: playerId } = auth.token;
  const gameId = randomBytes(8).toString('hex');
  logger.info(`Creating game with game ID ${gameId}, player ID ${playerId}, and player name ${playerName}.`, { structuredData: true });

  /* eslint-disable require-jsdoc */
  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);

    const newPlayer: Player = { id: playerId, name: playerName, color: 0 };
    const newGame: Game = {
      id: gameId,
      maxNumPlayers,
      inviteOnly,
      started: false,
      players: [newPlayer],
      tiles: [],
      numTilesAdded: 0,
    };

    await gameRef.set(newGame);

    return { gameId };
  }

  return impl();
});

export const joinGame = https.onCall((data, context) => {
  const { gameId, playerName } = data;
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'User is not authenticated.');
  }
  const { uid: playerId } = auth.token;
  logger.info(`Joining game with game ID ${gameId}, player ID ${playerId}, and player name ${playerName}.`, { structuredData: true });

  /* eslint-disable require-jsdoc */
  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }
    if (game.started) {
      throw new https.HttpsError('failed-precondition', 'The game is already started.');
    }
    if (game.players.length === game.maxNumPlayers) {
      throw new https.HttpsError('failed-precondition', 'The game is already full.');
    }

    const newPlayer: Player = { id: playerId, name: playerName, color: game.players.length };

    await gameRef.update({
      started: game.started || game.players.length + 1 === game.maxNumPlayers,
      players: firestore.FieldValue.arrayUnion(newPlayer),
    });

    return { gameId };
  }

  return impl();
});

export const startGame = https.onCall((data, context) => {
  const { gameId } = data;
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'User is not authenticated.');
  }
  const { uid: playerId } = auth.token;
  logger.info(`Starting game with game ID ${gameId}.`, { structuredData: true });

  /* eslint-disable require-jsdoc */
  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }
    if (game.players.length === 0 || game.players[0].id !== playerId) {
      throw new https.HttpsError('unauthenticated', 'User is not the host of the game.');
    }
    if (game.players.length < 2) {
      throw new https.HttpsError('failed-precondition', 'There must be at least two players to start the game.');
    }

    await gameRef.update({ started: true });

    return { gameId };
  }

  return impl();
});
