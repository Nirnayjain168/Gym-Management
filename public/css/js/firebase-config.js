// public/js/firebase-config.js

// Your web app's Firebase configuration
// (GET THIS FROM YOUR FIREBASE CONSOLE AFTER CREATING A WEB APP)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJp5pC--w-g-L7gRr1uzvN7c9BKKVxBYc",
  authDomain: "gym-management-system-8cd64.firebaseapp.com",
  projectId: "gym-management-system-8cd64",
  storageBucket: "gym-management-system-8cd64.firebasestorage.app",
  messagingSenderId: "29105806186",
  appId: "1:29105806186:web:f08d4f8d56420763942313",
  measurementId: "G-8WWL3MLE9B"
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
