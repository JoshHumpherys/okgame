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

  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }

    const { tiles } = game;

    const newTile: Tile = { playerId, x, y };

    await gameRef.update({ tiles: tiles.length > 0 ? firestore.FieldValue.arrayUnion(newTile) : [newTile] });

    return { gameId };
  }

  return impl();
});
