import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const uploadContactsButton = document.getElementById('uploadContactsButton');
const uploadSection = document.getElementById('uploadSection');
const addTagButton = document.getElementById('addTagButton');
const tagInput = document.getElementById('tagInput');
const tagsContainer = document.getElementById('tagsContainer');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('importFileInput');
const selectedFileName = document.getElementById('selectedFileName');
const uploadCSVButton = document.getElementById('uploadCSVButton');
let importTags = [];
let selectedFile = null;

document.getElementById('loadButton').addEventListener('click', loadData);
document.getElementById('webhookButton').addEventListener('click', triggerWebhook);
uploadContactsButton?.addEventListener('click', () => {
  uploadSection?.classList.toggle('hidden');
});
addTagButton?.addEventListener('click', addTag);
dropZone?.addEventListener('click', () => fileInput?.click());
dropZone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('hover');
});
dropZone?.addEventListener('dragleave', () => {
  dropZone.classList.remove('hover');
});
dropZone?.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('hover');
  if (event.dataTransfer.files.length) {
    selectedFile = event.dataTransfer.files[0];
    updateSelectedFileName();
  }
});
fileInput?.addEventListener('change', () => {
  selectedFile = fileInput.files[0] || null;
  updateSelectedFileName();
});
uploadCSVButton?.addEventListener('click', uploadCSV);

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("UID:", user.uid);
    loadClientName(); // Load client name
    loadData(); // Load data
    //triggerWebhook(); // Auto-trigger webhook on login
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

async function triggerWebhook() {
  const token = localStorage.getItem('token');

  if (!token) {
    console.log('No token for webhook');
    return;
  }

  try {
    const res = await fetch('/api/webhook-test', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!res.ok) {
      console.error('Webhook error:', res.status);
      return;
    }

    const data = await res.json();
    console.log('Webhook sent:', data);
  } catch (err) {
    console.error('Webhook error:', err);
  }
}

function addTag() {
  const tag = tagInput?.value?.trim();
  if (!tag) return;
  if (!importTags.includes(tag)) {
    importTags.push(tag);
  }
  if (tagInput) tagInput.value = '';
  renderTags();
}

function renderTags() {
  if (!tagsContainer) return;
  tagsContainer.innerHTML = importTags.length
    ? importTags.map((tag) => `<span>${tag}</span>`).join(', ')
    : 'No tags added';
}

function updateSelectedFileName() {
  if (!selectedFileName) return;
  selectedFileName.textContent = selectedFile?.name || 'No file selected';
}

function resetImportSection() {
  selectedFile = null;
  if (fileInput) fileInput.value = '';
  importTags = [];
  renderTags();
  if (selectedFileName) selectedFileName.textContent = 'No file selected';
  const defaultCountryRadio = document.querySelector('input[name="cc"][value="no"]');
  if (defaultCountryRadio) defaultCountryRadio.checked = true;
  const countryCode = document.getElementById('countryCode');
  if (countryCode) countryCode.value = '60';
}

async function uploadCSV() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in first.');
    return;
  }

  if (!selectedFile) {
    alert('Please select a CSV file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('hasCountryCode', document.querySelector('input[name="cc"]:checked')?.value || 'no');
  formData.append('countryCode', document.getElementById('countryCode')?.value || '60');
  formData.append('tags', JSON.stringify(importTags));

  try {
    const res = await fetch('/api/import-contacts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      alert(`Import failed: ${errorData?.error || res.status}`);
      return;
    }

    const data = await res.json();
    alert(`Imported ${data.imported || 0} contact(s).`);
    resetImportSection();
    uploadSection?.classList.add('hidden');
    loadData();
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload failed. See console for details.');
  }
}