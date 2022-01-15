import { https, logger } from 'firebase-functions';
import { randomBytes } from 'crypto';
import { firestore, initializeApp } from 'firebase-admin';

const app = initializeApp();
const db = app.firestore();

const colors = ['orange', 'blue', 'pink', 'green'];

export const createGame = https.onCall((data, context) => {
  const { playerName } = data;
  const gameId = randomBytes(8).toString('hex');
  logger.info(`Creating game with game ID ${gameId}.`, { structuredData: true });

  async function impl() {
    const gameRef = db.collection('games').doc(gameId);

    await gameRef.set({ gameId, players: [{ id: 0, name: playerName, color: colors[0] }] });

    return { gameId };
  }

  return impl();
});

export const joinGame = https.onCall((data, context) => {
  const { gameId, playerName } = data;
  logger.info(`Joining game with game ID ${gameId}.`, { structuredData: true });

  async function impl() {
    const gameRef = db.collection('games').doc(gameId);
    const game = await gameRef.get();
    if (!game.exists) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }

    const players = game.get('players') as { id: number, name: string }[];
    const lastPlayer = players[players.length - 1];
    const newId = lastPlayer.id + 1;

    const newPlayer = { id: newId, name: playerName, color: colors[newId % colors.length] };

    await gameRef.update({ players: firestore.FieldValue.arrayUnion(newPlayer) });

    return { gameId };
  }

  return impl();
});
