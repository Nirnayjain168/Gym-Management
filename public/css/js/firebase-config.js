// public/js/firebase-config.js

// Your web app's Firebase configuration
// (GET THIS FROM YOUR FIREBASE CONSOLE AFTER CREATING A WEB APP)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:   YOUR_API KEY
  authDomain: YOUR_DOMAIN NAME
  projectId: YOUR_PROJECTID
  storageBucket: YOUR_BUCKET
  messagingSenderId: YOUR_MESSAGINGSENDERID
  appId: YOUR_APPID
  measurementId: YOUR_MEASREMENTID
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

//[span_1](start_span)// Global logging function as per requirements[span_1](end_span)
// For production, consider using a dedicated logging service or Firebase Cloud Logging.
function logAction(action, details = {}) {
    console.log(`[LOG] Action: ${action}`, details);
    // You can send this to Firestore for centralized logging:
    db.collection('logs').add({
        action: action,
        details: details,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: auth.currentUser ? auth.currentUser.uid : 'anonymous'
    }).catch(error => console.error("Error logging action to Firestore:", error));
}
