import webpush from 'web-push';
import { writeFileSync } from 'node:fs';
const keys = webpush.generateVAPIDKeys();
writeFileSync('../steadiermind-notification-keys.env', `VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=mailto:steadiermind@gmail.com\n`, {mode:0o600,flag:'wx'});
console.log('Created ../steadiermind-notification-keys.env outside the website directory. Add these three values to Netlify environment variables for Functions, then redeploy. Keep the private key out of Git and chat.');
