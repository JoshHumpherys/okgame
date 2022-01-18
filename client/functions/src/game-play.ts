import { https, logger } from 'firebase-functions';
import { gameConverter } from '../../converters/gameConverter';
import { firestore } from 'firebase-admin';
import { db } from './db';
import { Tile } from '../../models/tile';

export const addTile = https.onCall((data, context) => {
  const { gameId, x, y } = data;
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'User is not authenticated.');
  }
  const { uid: playerId } = auth.token;
  logger.info(`Placing tile for game ID ${gameId}, player ID ${playerId}, x ${x}, and y ${y}.`, { structuredData: true });

  /* eslint-disable require-jsdoc */
  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }

    const { started, tiles, numTilesAdded } = game;

    if (!started) {
      throw new https.HttpsError('failed-precondition', 'The game has not started.');
    }

    const newTile: Tile = { playerId, x, y };

    await gameRef.update({
      tiles: tiles.length > 0 ? firestore.FieldValue.arrayUnion(newTile) : [newTile],
      numTilesAdded: numTilesAdded + 1,
    });

    return { };
  }

  return impl();
});

export const removeTile = https.onCall((data, context) => {
  const { gameId, x, y } = data;
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'User is not authenticated.');
  }
  const { uid: playerId } = auth.token;
  logger.info(`Removing tile for game ID ${gameId}, player ID ${playerId}, x ${x}, and y ${y}.`, { structuredData: true });

  /* eslint-disable require-jsdoc */
  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }

    const { started, tiles } = game;

    if (!started) {
      throw new https.HttpsError('failed-precondition', 'The game has not started.');
    }

    const tileToRemove = tiles.find(tile => tile.x === x && tile.y === y);

    if (!tileToRemove) {
      throw new https.HttpsError('not-found', 'Invalid tile.');
    }
    if (tileToRemove.playerId !== playerId) {
      throw new https.HttpsError('unauthenticated', 'The tile belongs to a different player.');
    }

    await gameRef.update({ tiles: firestore.FieldValue.arrayRemove(tileToRemove) });

    return { };
  }

  return impl();
});
