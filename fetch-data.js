const fs = require('fs');

const URL_INDEX = "https://script.google.com/macros/s/AKfycbwLXSog_nkbwnrRHBjZ4i35SSYiRmgNNPZL3YeGitAJlDceXYkJw0gLQ9zvc8Ra7ivc6w/exec";
const URL_PRESENTER = "https://script.google.com/macros/s/AKfycby4fAi7297I9fgBIsC1QagPWR8Gmu0b4A9R2Xnljl9j5tVD6vSg7N1N8Cx6ph5yhpzB/exec";
const URL_CKSS27 = "https://script.google.com/macros/s/AKfycbzsEtOi1LeS2CiEbPAWLVtOuhGFw5tbmr6H9Tx1AqqpFVHSuXy76QLBpOg-WNzC0DMO/exec";

async function fetchAndSave(url, fileName) {
  try {
    console.log(`Fetching ${fileName}...`);
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const text = await response.text();
    const data = JSON.parse(text);
    
    // กรณีที่เป็น index สามารถแยกเซฟเป็นสองไฟล์ได้ทันทีถ้าสคริปต์ต้นทางส่งข้อมูลมารวมกัน
    if (fileName === 'data/data-index.json' && data.captions && data.hashtags) {
      fs.writeFileSync('data/data-captions.json', JSON.stringify(data.captions, null, 2));
      fs.writeFileSync('data/data-hashtags.json', JSON.stringify(data.hashtags, null, 2));
      console.log(`✅ Separated captions and hashtags saved successfully!`);
    }

    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    console.log(`✅ ${fileName} saved successfully!`);
  } catch (err) {
    console.error(`❌ Error on ${fileName}:`, err.message);
    throw err;
  }
}

async function updateAllData() {
  let hasError = false;
  try { await fetchAndSave(URL_INDEX, 'data/data-index.json'); } catch(e) { hasError = true; }
  try { await fetchAndSave(URL_PRESENTER, 'data/data-presenter.json'); } catch(e) { hasError = true; }
  try { await fetchAndSave(URL_CKSS27, 'data/data-ckss27.json'); } catch(e) { hasError = true; }

  if (hasError) process.exit(1);
}

updateAllData();
