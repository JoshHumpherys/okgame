import { createApp } from 'vue'
import App from './App.vue'
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyC6qR9-eetmsVF_LMpHKxK9itULcDwLbjw',
  authDomain: 'okgame-bb2fb.firebaseapp.com',
  projectId: 'okgame-bb2fb',
  storageBucket: 'okgame-bb2fb.appspot.com',
  messagingSenderId: '699044580588',
  appId: '1:699044580588:web:9a1eb51eca362de155e9c9',
};

const vueApp = createApp(App);

// TODO: Get these from a config file split by dev/prod.
const paths = {
  auth: {
    url: 'http://localhost:9099',
  },
  functions: {
    host: 'localhost',
    port: 5001,
  },
  firestore: {
    host: 'localhost',
    port: 8081,
  },
};
vueApp.config.globalProperties.paths = paths;

const firebaseApp = initializeApp(firebaseConfig);

const functions = getFunctions(firebaseApp);
if (paths.functions) {
  connectFunctionsEmulator(functions, paths.functions.host, paths.functions.port);
}

const db = getFirestore();
if (paths.firestore) {
  connectFirestoreEmulator(db, paths.firestore.host, paths.firestore.port);
}

const auth = getAuth();
if (paths.auth) {
  connectAuthEmulator(auth, paths.auth.url);
}

signInAnonymously(auth)
    .then(() => {
      console.log('Signed in anonymously.');
    })
    .catch(error => {
      const { code: errorCode, message: errorMessage } = error;
      console.log(`Failed to sign in anonymously. errorCode=${errorCode}, errorMessage=${errorMessage}`);
    });

onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    const { uid } = user;
    console.log(`User signed in successfully. uid=${uid}`);
  } else {
    console.log('User signed out successfully.');
  }
});

vueApp.mount('#app');
