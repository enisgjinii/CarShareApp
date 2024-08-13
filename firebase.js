// firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCI66bwhJ-FMJFIs6Z0OKb-LHRU-jGX--M",
    authDomain: "carshare-162e0.firebaseapp.com",
    projectId: "carshare-162e0",
    storageBucket: "carshare-162e0.appspot.com",
    messagingSenderId: "357940057247",
    appId: "1:357940057247:web:817defc3f0386a7c027eaa"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();
export const firebase_app = firebase;

export default firebase;