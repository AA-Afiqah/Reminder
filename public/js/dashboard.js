import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.getElementById('loadButton').addEventListener('click', loadData);

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("UID:", user.uid);
    loadClientName(); // Load client name
    loadData(); // Load data
  }
});
async function loadClientName() {
  const token = localStorage.getItem('token');
  //console.log('loadClientName token:', token);

  if (!token) {
    alert('You are not authenticated. Please log in.');
    return;
  }

  const res = await fetch('/api/client-info', {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('client-info error', res.status, text);
    alert(`Failed to load client info: ${res.status}`);
    return;
  }

  const data = await res.json();

  document.getElementById('welcomeText').innerText =
    "Welcome back, " + (data.name || data.clientName || 'Client');
}
async function loadData() {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('You are not authenticated. Please log in.');
    return;
  }

  const res = await fetch('/api/contacts', {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Error loading contacts:', res.status, text);
    alert(`Failed to load contacts: ${res.status}`);
    return;
  }

  const data = await res.json();

  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3">No contacts found</td></tr>`;
    return;
  }

  data.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${c.firstName || c.name || '-'}</td>
      <td>${c.phone || '-'}</td>
    `;
    tableBody.appendChild(row);
  });
}