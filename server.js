const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/games', express.static('games'));
app.use('/reports', express.static('reports'));

// API: list all games
app.get('/api/games', (req, res) => {
  const gamesDir = path.join(__dirname, 'games');
  if (!fs.existsSync(gamesDir)) return res.json([]);
  const games = fs.readdirSync(gamesDir)
    .filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory())
    .map(dir => {
      const meta = path.join(gamesDir, dir, 'meta.json');
      if (fs.existsSync(meta)) {
        try { return { id: dir, ...JSON.parse(fs.readFileSync(meta, 'utf8')) }; }
        catch { return { id: dir, name: dir, description: 'A game' }; }
      }
      return { id: dir, name: dir, description: 'A game' };
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(games);
});

// API: list all test reports
app.get('/api/reports', (req, res) => {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) return res.json([]);
  const reports = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8')); }
      catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  res.json(reports);
});

app.listen(PORT, () => {
  console.log(`monday.com Arcade running on port ${PORT}`);
});
