importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDMmO3BnFDMacdFtGNRllHvPc0xNS9WiHo",
  authDomain: "studymyte.firebaseapp.com",
  projectId: "studymyte",
  storageBucket: "studymyte.firebasestorage.app",
  messagingSenderId: "574883093044",
  appId: "1:574883093044:web:05cfa63fa1b46595234861",
  measurementId: "G-50D1BHD290"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
