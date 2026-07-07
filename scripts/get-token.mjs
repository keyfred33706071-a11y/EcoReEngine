const API_KEY = 'AIzaSyCHRevY_ZXZPTAfg8OeLmrnErfQlylk1Ms';

// Sign in with the user I created earlier
const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'testuser@temp.com', password: 'TestPass123!', returnSecureToken: true })
});
const data = await r.json();
console.log('idToken:', data.idToken?.slice(0, 50) + '...');
console.log('refreshToken:', data.refreshToken?.slice(0, 50) + '...');
console.log('localId:', data.localId);
console.log('full:', JSON.stringify(data));
