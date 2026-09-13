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

async function loadData() {
    // Step A: นำข้อมูลจาก data.js มาแสดงผลทันทีแบบ Instant
    let rawData = null;
    if (typeof defaultData !== 'undefined') {
        rawData = defaultData;
    } else if (typeof data !== 'undefined') {
        rawData = data;
    } else if (typeof captionsData !== 'undefined') {
        rawData = captionsData;
    }

    if (rawData) {
        captionsData = rawData.captions || (Array.isArray(rawData) ? rawData : []);
        hashtagData = rawData.hashtags || [];
        
        theme(currentCampaign);
        updateStatus();
        updateDots();
    }

    // Step B: ตรวจสอบว่ามีข้อมูลล่าสุดที่เคยเซฟไว้ใน IndexedDB หรือไม่
    const localData = await getStoredData();
    if (localData && localData.captions && localData.captions.length > 0) {
        captionsData = localData.captions;
        hashtagData = localData.hashtags || [];
        theme(currentCampaign);
        updateStatus();
    }

    // Step C: ดึง Google Sheet เบื้องหลังแบบเงียบๆ
    fetch("https://script.google.com/macros/s/AKfycbwLXSog_nkbwnrRHBjZ4i35SSYiRmgNNPZL3YeGitAJlDceXYkJw0gLQ9zvc8Ra7ivc6w/exec")
    .then(r => r.json())
    .then(d => { 
        if (d.captions && d.captions.length > 0) {
            captionsData = d.captions; 
            hashtagData = d.hashtags || []; 
            saveStoredData(d);
        }
    })
    .catch(err => console.log("Background sync skipped/failed:", err));
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
        alert("The data has not yet finished loading. Please wait...");
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
                el.innerText = cap + (tags ? "\n\n" + tags.hashtags : "");
            } else {
                el.innerText = cap;
            }
            
            isSpinning = false;
            progressBar.style.width = "100%";
            setTimeout(() => { progressContainer.style.display = "none"; }, 300);
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
    document.getElementById("cursorGlow").style.background = `radial-gradient(circle, ${glowColors[t] || '#F9B2D744'}, transparent 60%)`;
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
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

function updateDots() {
    const dotsContainer = document.getElementById("dotsContainer");
    const visibleItems = Array.from(document.querySelectorAll(".campaign-item")).filter(i => i.style.display !== "none");
    dotsContainer.innerHTML = ""; 
    visibleItems.forEach(item => {
        const dot = document.createElement("div");
        dot.className = "dot" + (item.classList.contains("active") ? " active" : "");
        dotsContainer.appendChild(dot);
    });
}

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