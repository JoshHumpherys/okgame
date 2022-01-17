import { https, logger } from 'firebase-functions';
import { gameConverter } from '../../converters/gameConverter';
import { firestore } from 'firebase-admin';
import { randomBytes } from 'crypto';
import { db } from './db';
import { Game } from '../../models/game';
import { Player } from '../../models/player';

export const createGame = https.onCall((data, context) => {
  const { playerName } = data;
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'User is not authenticated.');
  }
  const { uid: playerId } = auth.token;
  const gameId = randomBytes(8).toString('hex');
  logger.info(`Creating game with game ID ${gameId}, player ID ${playerId}, and player name ${playerName}.`, { structuredData: true });

  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);

    const newPlayer: Player = { id: playerId, name: playerName, color: 0 };
    const newGame: Game = { id: gameId, players: [newPlayer], tiles: [] };

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

  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }

    const newPlayer: Player = { id: playerId, name: playerName, color: game.players.length };

    await gameRef.update({ players: firestore.FieldValue.arrayUnion(newPlayer) });

    return { gameId };
  }

  return impl();
});
