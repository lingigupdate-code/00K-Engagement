const fs = require('fs');

const URL_INDEX = "https://script.google.com/macros/s/AKfycbzDpLJ0f6uCpHARY2pU8EZt5UDO1Bk3LOa_ZG-3llN_TYzrnjWj4AMA7ZZdz8i1pwlk/exec";
const URL_PRESENTER = "https://script.google.com/macros/s/AKfycby4fAi7297I9fgBIsC1QagPWR8Gmu0b4A9R2Xnljl9j5tVD6vSg7N1N8Cx6ph5yhpzB/exec";
const URL_CKSS27 = "https://script.google.com/macros/s/AKfycbybRi3xvyB1fHl0YYBHo-Hp9UhXUMlXl_tpbKJ14L3qzJSQ1Dr99jime8nAdOT7T-ycew/exec";

async function fetchAndSave(url, fileName) {
  try {
    console.log(`Fetching ${fileName}...`);
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const text = await response.text();
    const data = JSON.parse(text);
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    console.log(`✅ ${fileName} saved successfully!`);
  } catch (err) {
    console.error(`❌ Error on ${fileName}:`, err.message);
    throw err;
  }
}

async function updateAllData() {
  let hasError = false;
  try { await fetchAndSave(URL_INDEX, 'data-index.json'); } catch(e) { hasError = true; }
  try { await fetchAndSave(URL_PRESENTER, 'data-presenter.json'); } catch(e) { hasError = true; }
  try { await fetchAndSave(URL_CKSS27, 'data-ckss27.json'); } catch(e) { hasError = true; }

  if (hasError) process.exit(1);
}

updateAllData();
