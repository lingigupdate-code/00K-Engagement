let captionsData = [], hashtagData = [];
let currentBrand = "Dior", currentCampaign = "Dior_OpenStore", currentPlatform = "IG", isSpinning = false;
let isInternalScrolling = false;
let includeHashtags = true;

const slider = document.getElementById("slider");
const n = t => (t || "").toLowerCase().replace(/\s|_/g, "");

function updateStatus() {
    let label = currentCampaign
        .replace("Dior_", "")
        .replace("CalvinKlein", "Calvin Klein")
        .replace("_", " ");
    document.getElementById("statusText").innerText = label + " • " + currentPlatform;
}

// คีย์สำหรับเก็บ Cache ของแคปชันและแฮชแท็ก
const DATA_INDEX_URL = "data-index.json";
const CACHE_KEY = "00k_index_data_cache";
const HASHTAGS_CACHE_KEY = "00k_hashtags_only_cache";

// ลิงก์ Apps Script ดึงเฉพาะแฮชแท็กสดๆ (หากต้องการอัปเดตแฮชแท็กบ่อยๆ)
const HASHTAGS_API_URL = "https://script.google.com/macros/s/AKfycbzDpLJ0f6uCpHARY2pU8EZt5UDO1Bk3LOa_ZG-3llN_TYzrnjWj4AMA7ZZdz8i1pwlk/exec";

// ระบบฐานข้อมูลภายในเครื่อง (IndexedDB)
const DB_NAME = "00K_Database";
const STORE_NAME = "captionsStore";
const DB_VERSION = 1;

const statusEl = document.getElementById("statusText");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

function getStoredData() {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDatabase();
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get("appData");
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            resolve(null);
        }
    });
}

async function saveStoredData(data) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put(data, "appData");
    } catch (e) {
        console.warn("Could not save to IndexedDB", e);
    }
}

// 🎯 1. โหลดข้อมูลแคปชัน (ไม่มีหมดอายุ 3 ชม. ถ้านผู้ใช้ไม่กดอัปเดตเอง)
async function loadData() {
    // A. อ่านแคชแคปชันที่มีอยู่ในเครื่องก่อน
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        const d = JSON.parse(cachedData);
        captionsData = d.captions || (Array.isArray(d) ? d : []);
        hashtagData = d.hashtags || [];
    }

    // B. อ่านแคชแฮชแท็กฉุกเฉิน (ถ้ามีอัปเดตแยกไว้)
    const cachedHashtags = localStorage.getItem(HASHTAGS_CACHE_KEY);
    if (cachedHashtags) {
        hashtagData = JSON.parse(cachedHashtags);
    }

    // C. ถ้ายังไม่มีแคปชันเลย ให้โหลดครั้งแรกสุดจาก data-index.json
    if (!captionsData || captionsData.length === 0) {
        await manualUpdateAllData(false); // โหลดแบบเงียบๆ ครั้งแรก
    } else {
        theme(currentCampaign);
        updateStatus();
        updateDots();
    }
}

// 🎯 2. ฟังก์ชันอัปเดตเฉพาะ "แฮชแท็ก" (ดึงสดทันที)
async function updateHashtagsOnly() {
    try {
        console.log("Fetching latest hashtags...");
        const res = await fetch(DATA_INDEX_URL + "?t=" + Date.now()); // หรือใช้ HASHTAGS_API_URL
        if (!res.ok) throw new Error("Fetch failed");
        
        const d = await res.json();
        if (d.hashtags && d.hashtags.length > 0) {
            hashtagData = d.hashtags;
            localStorage.setItem(HASHTAGS_CACHE_KEY, JSON.stringify(d.hashtags));
            alert("✅ อัปเดตแฮชแท็กเรียบร้อยแล้ว!");
        }
    } catch (err) {
        console.error("Failed to update hashtags:", err);
        alert("❌ ไม่สามารถอัปเดตแฮชแท็กได้ กรุณาลองใหม่อีกครั้ง");
    }
}

// 🎯 3. ฟังก์ชันสำหรับให้ผู้ใช้กด "อัปเดตแคปชันและข้อมูลทั้งหมด" เองด้วยตัวเอง
async function manualUpdateAllData(showAlert = true) {
    try {
        const res = await fetch(DATA_INDEX_URL + "?v=" + Date.now());
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const d = await res.json();
        
        captionsData = d.captions || (Array.isArray(d) ? d : []);
        hashtagData = d.hashtags || [];

        // บันทึกลงความจำยาวๆ
        localStorage.setItem(CACHE_KEY, JSON.stringify(d));
        localStorage.removeItem(HASHTAGS_CACHE_KEY); // ล้างแคชแฮชแท็กแยกเพื่อให้ใช้ตัวล่าสุดร่วมกัน
        saveStoredData(d);

        theme(currentCampaign);
        updateStatus();
        updateDots();

        if (showAlert) alert("✅ อัปเดตข้อมูลแคปชันและแฮชแท็กทั้งหมดเรียบร้อยแล้ว!");
    } catch (err) {
        console.error("Manual update failed:", err);
        if (showAlert) alert("❌ อัปเดตข้อมูลไม่สำเร็จ กรุณาเช็กการเชื่อมต่ออินเทอร์เน็ต");
    }
}

async function clearCacheAndReload() {
    indexedDB.deleteDatabase("00K_Database");
    localStorage.clear();
    location.reload();
}

function toggleHashtags(checkbox) {
    includeHashtags = checkbox.checked;
    const label = document.getElementById("toggleLabel");
    if (includeHashtags) {
        label.innerHTML = "#️⃣ With Hashtag";
        label.style.color = "rgba(255, 255, 255, 0.8)";
    } else {
        label.innerHTML = "❌ No Hashtag";
        label.style.color = "rgba(255, 255, 255, 0.4)";
    }
}

function spin() {
    if (isSpinning) return;
    
    if (captionsData.length === 0) {
        alert("ยังไม่มีข้อมูลแคปชัน กรุณากดปุ่มอัปเดตข้อมูลด้านล่าง...");
        return;
    }

    const filtered = captionsData.filter(c => n(c.brand) === n(currentBrand) && n(c.campaign) === n(currentCampaign)).map(c => c.caption);
    
    if (!filtered.length) {
        alert("No captions found for this campaign.");
        return;
    }

    isSpinning = true;
    const el = document.getElementById("result"); 
    el.classList.add("show");
    
    let i = 0;
    const int = setInterval(() => {
        el.innerText = filtered[Math.floor(Math.random() * filtered.length)];
        if (i++ > 12) {
            clearInterval(int);
            const cap = filtered[Math.floor(Math.random() * filtered.length)];
            
            if (includeHashtags) {
                const tags = hashtagData.find(h => n(h.brand) === n(currentBrand) && n(h.campaign) === n(currentCampaign) && n(h.platform) === n(currentPlatform));
                el.innerText = cap + (tags && tags.hashtags ? "\n\n" + tags.hashtags : "");
            } else {
                el.innerText = cap;
            }
            
            isSpinning = false;
            if (progressBar) progressBar.style.width = "100%";
            setTimeout(() => { if (progressContainer) progressContainer.style.display = "none"; }, 300);
        }
    }, 60);
}

function setBrand(brand, btn) {
    currentBrand = brand;
    isInternalScrolling = true;
    document.querySelectorAll(".brand-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const allItems = document.querySelectorAll(".campaign-item");
    let firstVisibleMatch = null;

    allItems.forEach(item => {
        const campaignKey = item.dataset.c;
        const belongs = 
            (brand === "Dior" && campaignKey.startsWith("Dior")) || 
            (brand === "Cartier" && campaignKey === "Cartier") ||
            (brand === "CalvinKlein" && (campaignKey === "CalvinKlein" || campaignKey === "NYFW"));
        
        item.style.display = belongs ? "flex" : "none";
        if (belongs && !firstVisibleMatch) firstVisibleMatch = item;
    });

    if (firstVisibleMatch) {
        document.querySelectorAll(".campaign-item").forEach(i => i.classList.remove("active"));
        firstVisibleMatch.classList.add("active");
        currentCampaign = firstVisibleMatch.dataset.c;
        slider.scrollLeft = 0; 
        theme(currentCampaign);
        updateStatus();
        updateDots();
    }
    setTimeout(() => { isInternalScrolling = false; }, 100);
}

function theme(c) {
    let t = "Fashion";
    if (c === "Dior_Fashion") t = "Fashion";
    else if (c === "Dior_Beauty") t = "Beauty";
    else if (c === "Dior_EyeWear") t = "EyeWear";
    else if (c === "Dior_PFW") t = "PFW";
    else if (c === "Dior_OpenStore") t = "DiorOpenStore";
    else if (c === "Cartier") t = "Cartier";
    else if (c === "CalvinKlein") t = "CalvinKlein";
    else if (c === "NYFW") t = "CalvinKlein_NYFW";

    document.body.dataset.theme = t;

    const glowColors = { 
        Fashion: "#F9B2D744", 
        Beauty: "#CFECF344", 
        EyeWear: "#DAF9DE44", 
        PFW: "#D9C2FF44", 
        DiorOpenStore: "#FFD1DC44",
        Cartier: "#F6FFDC44",
        CalvinKlein: "#E2E2E244"
    };
    const glowEl = document.getElementById("cursorGlow");
    if (glowEl) {
        glowEl.style.background = `radial-gradient(circle, ${glowColors[t] || '#F9B2D744'}, transparent 60%)`;
    }
}

function selectCampaign(el) {
    if (el.style.display === "none") return;
    isInternalScrolling = true;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    currentCampaign = el.dataset.c;
    document.querySelectorAll(".campaign-item").forEach(i => i.classList.remove("active"));
    el.classList.add("active");
    theme(currentCampaign);
    updateStatus();
    updateDots();
    setTimeout(() => { isInternalScrolling = false; }, 600);
}

function setPlatform(p, btn) {
    currentPlatform = p;
    document.querySelectorAll(".platform-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateStatus();
}

function copy() {
    const t = document.getElementById("result").innerText;
    if (!t) return;
    navigator.clipboard.writeText(t);
    const toast = document.getElementById("toast");
    if (toast) {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
    }
}

function updateDots() {
    const dotsContainer = document.getElementById("dotsContainer");
    if (!dotsContainer) return;
    const visibleItems = Array.from(document.querySelectorAll(".campaign-item")).filter(i => i.style.display !== "none");
    dotsContainer.innerHTML = ""; 
    visibleItems.forEach(item => {
        const dot = document.createElement("div");
        dot.className = "dot" + (item.classList.contains("active") ? " active" : "");
        dotsContainer.appendChild(dot);
    });
}

if (slider) {
    slider.addEventListener("scroll", () => {
        if (isInternalScrolling) return;
        const visibleItems = Array.from(document.querySelectorAll(".campaign-item")).filter(i => i.style.display !== "none");
        let mid = slider.scrollLeft + (slider.offsetWidth / 2);
        let best = null;
        let dist = 9999;
        visibleItems.forEach(i => {
            let center = i.offsetLeft + (i.offsetWidth / 2);
            let d = Math.abs(mid - center);
            if (d < dist) { dist = d; best = i; }
        });
        if (best && best.dataset.c !== currentCampaign) {
            currentCampaign = best.dataset.c;
            document.querySelectorAll(".campaign-item").forEach(i => i.classList.remove("active"));
            best.classList.add("active");
            theme(currentCampaign);
            updateStatus();
            updateDots();
        }
    });
}

document.addEventListener("mousemove", e => {
    const g = document.getElementById("cursorGlow");
    if(g) { g.style.left = e.clientX + "px"; g.style.top = e.clientY + "px"; }
});

const emojis = ['🍗', '🥚', '🍌'];

function createEmoji() {
    const emoji = document.createElement('div');
    emoji.classList.add('emoji-snow');
    emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = Math.random() * 100 + 'vw';
    emoji.style.fontSize = Math.random() * 20 + 15 + 'px';
    const duration = Math.random() * 3 + 3; 
    emoji.style.animationDuration = duration + 's';
    emoji.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(emoji);
    setTimeout(() => { emoji.remove(); }, (duration + 2) * 1000);
}

setInterval(createEmoji, 400);

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});
