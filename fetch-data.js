const fs = require('fs');

const URL_INDEX = "https://script.google.com/macros/s/AKfycbzDpLJ0f6uCpHARY2pU8EZt5UDO1Bk3LOa_ZG-3llN_TYzrnjWj4AMA7ZZdz8i1pwlk/exec";
const URL_PRESENTER = "https://script.google.com/macros/s/AKfycby4fAi7297I9fgBIsC1QagPWR8Gmu0b4A9R2Xnljl9j5tVD6vSg7N1N8Cx6ph5yhpzB/exec";
const URL_CKSS27 = "https://script.google.com/macros/s/AKfycbw8iAeQXNzFSYJC4DqMVWEScFQUWuxP2KRot-bXRYwI_6yjdFhVSPI98G_eG-LKS2_9/exec";

// ฟังก์ชันช่วยดึงข้อมูลและบันทึกไฟล์แบบปลอดภัย
async function fetchAndSave(url, fileName) {
  try {
    console.log(`Fetching ${fileName} from: ${url}`);
    
    // ตั้งค่ารองรับการดึง Redirect จาก Google Apps Script
    const response = await fetch(url, { redirect: 'follow' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    // ตรวจสอบว่าสิ่งที่ได้กลับมาเป็น JSON หรือไม่
    try {
      const data = JSON.parse(text);
      fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
      console.log(`✅ ${fileName} saved successfully!`);
    } catch (jsonErr) {
      console.error(`❌ ${fileName} response is NOT valid JSON!`);
      console.error(`Response preview: ${text.substring(0, 150)}...`);
      throw jsonErr;
    }

  } catch (err) {
    console.error(`⚠️ Failed to update ${fileName}:`, err.message);
    throw err; // ส่งต่อ error ให้ฟังก์ชันหลักรู้
  }
}

async function updateAllData() {
  console.log("Starting data fetch for all pages...");
  let hasError = false;

  // ทำการดึงทีละไฟล์อย่างเป็นระเบียบ
  try { await fetchAndSave(URL_INDEX, 'data-index.json'); } catch(e) { hasError = true; }
  try { await fetchAndSave(URL_PRESENTER, 'data-presenter.json'); } catch(e) { hasError = true; }
  try { await fetchAndSave(URL_CKSS27, 'data-ckss27.json'); } catch(e) { hasError = true; }

  if (hasError) {
    console.error("❌ Some files failed to update.");
    process.exit(1);
  } else {
    console.log("🎉 All JSON files updated successfully!");
  }
}

updateAllData();
