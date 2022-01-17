import { https, logger } from 'firebase-functions';
import { randomBytes } from 'crypto';
import { firestore, initializeApp } from 'firebase-admin';
import { Color } from '../../models/color';
import { Player } from '../../models/player';
import { Game } from '../../models/game';
import { gameConverter } from '../../converters/gameConverter';

const app = initializeApp();
const db = app.firestore();

export const createGame = https.onCall((data, context) => {
  const { playerName } = data;
  const gameId = randomBytes(8).toString('hex');
  logger.info(`Creating game with game ID ${gameId}.`, { structuredData: true });

  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);

    const newPlayer = new Player(0, playerName, 0);
    const newGame = new Game(gameId, [newPlayer]);

    await gameRef.set(newGame);

    return { gameId };
  }

  return impl();
});

export const joinGame = https.onCall((data, context) => {
  const { gameId, playerName } = data;
  logger.info(`Joining game with game ID ${gameId}.`, { structuredData: true });

  async function impl() {
    const gameRef = db.collection('games').doc(gameId).withConverter(gameConverter);
    const gameSnapshot = await gameRef.get();
    const game = gameSnapshot.data();
    if (!gameSnapshot.exists || !game) {
      throw new https.HttpsError('not-found', 'Invalid game ID.');
    }

    const { players } = game;
    const lastPlayer = players[players.length - 1];
    const newId = lastPlayer.id + 1;

    const newPlayer = new Player(newId, playerName, newId % (Object.keys(Color).length / 2));

    await gameRef.update({ players: firestore.FieldValue.arrayUnion(newPlayer) });

    return { gameId };
  }

  return impl();
});
