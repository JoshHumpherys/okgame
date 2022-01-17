import { Game } from '../models/game';

export const gameConverter = {
  toFirestore: (game: Game) => game,
  fromFirestore: snapshot => snapshot.data() as Game,
} as FirebaseFirestore.FirestoreDataConverter<Game>;
