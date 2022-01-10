import * as functions from 'firebase-functions';
import { randomBytes } from 'crypto';

const admin = require('firebase-admin');
admin.initializeApp();

// const cors = require('cors')({ origin: true });

// export const createGame = functions.https.onRequest((request, response) => {
//   cors(request, response, () => {
//     console.log(request);
//     const gameId = randomBytes(8).toString('hex');
//     functions.logger.info(`Creating game with game ID ${gameId}.`, { structuredData: true });
//     admin.firestore().collection('games').add({ gameId })
//       .then(() => {
//         response.send({ data: { gameId } });
//       })
//       .catch(() => {
//         response.status(500).json({ data: {} });
//       });
//   });
// });
//
// export const joinGame = functions.https.onRequest((request, response) => {
//   cors(request, response, () => {
//     const { gameId } = request.body;
//     functions.logger.info(`Joining game with game ID ${gameId}.`, { structuredData: true });
//     response.status(200).json({ data: {} });
//   });
// });

export const createGame = functions.https.onCall((data, context) => {
  const gameId = randomBytes(8).toString('hex');
  functions.logger.info(`Creating game with game ID ${gameId}.`, { structuredData: true });
  return new Promise((res, rej) => {
    admin.firestore().collection('games').doc(gameId).set({ gameId, players: ['player1'] })
      .then(() => {
        res({ gameId });
      })
      .catch(() => {
        rej({});
      });
  });
});

export const joinGame = functions.https.onCall((data, context) => {
    const { gameId } = data;
    functions.logger.info(`Joining game with game ID ${gameId}.`, { structuredData: true });
    return new Promise((res, rej) => {
      const firestore = admin.firestore();
      firestore.collection('games').doc(gameId).update({ players: firestore.FieldValue.arrayUnion('player2') })
        .then(() => {
          res({});
        })
        .catch(() => {
          rej({});
        });
  });
});
