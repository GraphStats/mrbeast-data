const express = require('express');
const fs = require('fs');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

const dataPath = './data.json';
const channelID = 'UCX6OQ3DkcsbYNE6H8uQQuVA';
const apiURL = `https://backend.mixerno.space/api/youtube/estv3/${channelID}`;

let previousCount = 0;

// Fonction pour formater la date et l'heure
function formatDate() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0'); // <-- ajout des secondes

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // <-- secondes ajoutées ici
}

// Fonction pour récupérer les abonnés et sauvegarder
async function fetchAndSaveData() {
  try {
    const res = await fetch(apiURL);
    const data = await res.json();
    const newCount = parseInt(data?.items?.[0]?.statistics?.subscriberCount || "0", 10);

    const currentTime = formatDate();
    let json = { labels: [], data: [] };

    // Si le fichier existe, charge les données
    if (fs.existsSync(dataPath)) {
      json = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }

    // Enregistrer la même valeur même si elle n'a pas changé
    json.labels.push(currentTime);
    json.data.push(newCount);

    // Sauvegarder les nouvelles données
    fs.writeFileSync(dataPath, JSON.stringify(json));

    // Toujours afficher le nombre d'abonnés actuel dans les logs
    console.log(`[${currentTime}] ${newCount} abonnés enregistrés`);

    // Mettre à jour la variable précédente à chaque intervalle
    previousCount = newCount;

  } catch (error) {
    console.error("Erreur récupération/sauvegarde :", error.message);
  }
}

// Toutes les 2 secondes (même si le compteur ne change pas)
setInterval(fetchAndSaveData, 2000);

// Route publique pour frontend
app.get('/data', (req, res) => {
  if (fs.existsSync(dataPath)) {
    const json = fs.readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(json));
  } else {
    res.json({ labels: [], data: [] });
  }
});

const port = process.env.PORT || 20095;
app.listen(port, () => {
  console.log(`Backend actif sur le port ${port}`);
});
