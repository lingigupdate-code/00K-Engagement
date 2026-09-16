const POST_TARGETS = {
  likes: 1200000,
  comments: 100000,
  reposts: 60000,
  shares: 1000000,
  views: 5000000
};

let globalCaptionsData = [];
let globalHashtagData = [];
let globalRawDataset = []; 
let widgetPlatform = "IG";
let widgetIncludeHashtags = true;

const mivPages = {};
const brandPages = {};
const ITEMS_PER_PAGE = 24;

const n = t => (t || "").toLowerCase().replace(/\s|_/g, "");

async function loadCaptionSourceData() {
  try {
    const [resCaps, resTags] = await Promise.all([
      fetch('data/data-captions.json?v=' + Date.now()),
      fetch('data/data-hashtags.json?v=' + Date.now())
    ]);

    if (!resCaps.ok || !resTags.ok) throw new Error("No Found Data");
    
    globalCaptionsData = await resCaps.json();
    globalHashtagData = await resTags.json();
  } catch (err) {
    console.error("Failed to load captions or hashtags:", err);
  }
}

function hideWidget() {
  document.getElementById('floatingCaptionWidget').style.display = 'none';
  document.getElementById('floatingTriggerBtn').style.display = 'flex';
}

function showWidget() {
  document.getElementById('floatingCaptionWidget').style.display = 'block';
  document.getElementById('floatingTriggerBtn').style.display = 'none';
  generateWidgetCaption();
}

function setWidgetPlatform(p, btn) {
  widgetPlatform = p;
  document.querySelectorAll(".widget-platform-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  generateWidgetCaption();
}

function toggleWidgetHashtags(checkbox) {
  widgetIncludeHashtags = checkbox.checked;
  const label = document.getElementById("widgetToggleLabel");
  if (widgetIncludeHashtags) {
    label.innerHTML = "#️⃣ With Hashtag";
  } else {
    label.innerHTML = "❌ No Hashtag";
  }
  generateWidgetCaption();
}

function generateWidgetCaption() {
  const display = document.getElementById('widgetCaptionDisplay');
  if (!display) return;
  
  if (!globalCaptionsData || globalCaptionsData.length === 0) {
    display.innerText = "Loading captions...";
    return;
  }

  const filtered = globalCaptionsData.filter(c => 
    n(c.brand) === n("CalvinKlein") && n(c.campaign) === n("NYFW")
  ).map(c => c.caption);

  if (!filtered || filtered.length === 0) {
    display.innerText = "No Found Captions for CalvinKlein Campaign NYFW in data";
    return;
  }

  const randomCap = filtered[Math.floor(Math.random() * filtered.length)];
  let finalResult = randomCap;

  if (widgetIncludeHashtags) {
    const tags = globalHashtagData.find(h => 
      n(h.brand) === n("CalvinKlein") && n(h.campaign) === n("NYFW") && n(h.platform) === n(widgetPlatform)
    );
    if (tags && tags.hashtags) {
      finalResult += "\n\n" + tags.hashtags;
    }
  }

  display.innerText = finalResult;
}

function copyWidgetCaption() {
  const display = document.getElementById('widgetCaptionDisplay');
  if (!display) return;
  const text = display.innerText;
  if (!text || text.includes("No Found")) return;
  
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2000);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCaptionSourceData();
  generateWidgetCaption();
  loadData();
});

let currentType="all";

function switchType(type){
  currentType=type;

  document.querySelectorAll(".type-tabs button")
    .forEach(btn=>btn.classList.remove("active"));

  if(type==="lingling"){
    document.getElementById("tabLingling").classList.add("active");
    document.body.setAttribute("data-theme","artist");
  }
  else if(type==="brand"){
    document.getElementById("tabBrand").classList.add("active");
    document.body.setAttribute("data-theme","artist");
  }
  else if(type==="media"){
    document.getElementById("tabMedia").classList.add("active");
    document.body.setAttribute("data-theme","media");
  }
  else{
    document.getElementById("tabAll").classList.add("active");
    document.body.removeAttribute("data-theme");
  }

  loadData();
}

let player;
let playerReady = false;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('bgMusic', {
    events: {
      'onReady': function(event) {
        playerReady = true;
        event.target.setVolume(100);
      }
    }
  });
}

function playMusic() {
  if (playerReady && player && typeof player.playVideo === 'function') {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  } else {
    const iframe = document.getElementById('bgMusic');
    if (iframe) {
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  }
}

const URL_CKSS27 = "https://script.google.com/macros/s/AKfycbz40MAsO2k63Ce-LwSUcOOYIqignSJie9Ih6DfmZv28gQF9124nnuNPreuLLGYzsS0HBQ/exec";

const CACHE_KEY_CKSS27 = "cache_ckss27_posts";

function loadData(){
    const linglingCont = document.getElementById("linglingContent");
    const brandCont = document.getElementById("brandContent");
    const mediaCont = document.getElementById("mediaContent");
    const cachedData = localStorage.getItem(CACHE_KEY_CKSS27);
    
    if (cachedData) {
        try {
            const items = JSON.parse(cachedData);
            globalRawDataset = items;
            populatePlatformFilter(items);
            render(items);
        } catch (e) {
            console.error("Cache parse error", e);
        }
    } else if(linglingCont && linglingCont.innerHTML === "") {
        linglingCont.innerHTML = `
            <div class="empty-state">
                <div class="spinner"></div>
                <h3>Loading Campaign Data...</h3>
                <p>Loading.....</p>
            </div>
        `;
    } 

    // เปลี่ยนจาก API_URL มาใช้ URL_CKSS27 ที่คุณกำหนดไว้ด้านบนสุดของไฟล์แทน
    fetch(URL_CKSS27 + "?v=" + Date.now())
        .then(res => res.json())
        .then(data => {
            const items = Array.isArray(data) ? data : (data.items || data.posts || data.captions || data.data || []);
            globalRawDataset = items;
            // ---- ดึงค่าเวลาจากแถวบนสุด (items[0]) ช่องเดียว ----
            if (items.length > 0) {
                // เปลี่ยนคำว่า "timestamp" หรือ "last_update" ให้ตรงกับหัวคอลัมน์จริงใน Google Sheet
                const topRowTime = items[0].timestamp || items[0].last_update || items[0].time;
                
                if (topRowTime) {
                    const timeEl = document.getElementById("lastUpdatedTime");
                    if (timeEl) {
                        timeEl.innerText = topRowTime;
                    }
                }
            }
            // ----------------------------------------------------
          
            localStorage.setItem(CACHE_KEY_CKSS27, JSON.stringify(items));
            populatePlatformFilter(items);
            render(items);
        })
        .catch(err => {
            console.error("Error loading data from Google Sheets:", err);
            if(!cachedData && linglingCont) {
                linglingCont.innerHTML = `
                    <div class="empty-state">
                        <h3>Awaiting Data Connection</h3>
                        <p>No Found Data</p>
                    </div>
                `;
            }
            if(!cachedData) {
                if(brandCont) brandCont.innerHTML = "";
                if(mediaCont) mediaCont.innerHTML = "";
            }
        });
}

function populatePlatformFilter(data){
  const select = document.getElementById("platformFilter");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="all">All Platforms</option>';
  const platforms = [...new Set(data.map(p => p.platform?.trim()))];
  platforms.forEach(p => {
    if(!p) return;
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });
  select.value = currentValue || "all";
}

function classifySubCategory(p) {
  const tabName = (p.sheetTab || p.sourceTab || p.tabName || "").toString().trim().toLowerCase();
  const type = (p.sheetType || "").toString().trim().toLowerCase();
  
  if (type === "media" || tabName.includes("media") || tabName.includes("kol") || tabName.includes("press")) {
    return "media";
  }

  const name = (p.post_name || "").toLowerCase().replace(/\s+/g, "");
  if (name.includes("lingling") || name.includes("linglingkwong") || name.includes("lingsirilak") || name.includes("00k")) {
    return "lingling";
  }
  
  return "brand"; 
}

const platformOrder = ["IG", "Instagram", "X", "Twitter", "Facebook", "FB", "Tiktok", "Thread", "Threads"];

function sortDataByPlatform(data) {
  return data.sort((a, b) => {
    let platA = (a.platform || "").toLowerCase();
    let platB = (b.platform || "").toLowerCase();
    
    let indexA = platformOrder.findIndex(p => platA.includes(p.toLowerCase()));
    let indexB = platformOrder.findIndex(p => platB.includes(p.toLowerCase()));
    
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    
    return indexA - indexB;
  });
}

function render(data){
  const selectedPlatform = document.getElementById("platformFilter") ? document.getElementById("platformFilter").value : "all";
  const sort = document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "sheet_desc";

  const uniqueMap = new Map();
  data.forEach(p => {
    const linkKey = String(p.link || "").trim();
    if (linkKey && !uniqueMap.has(linkKey)) {
      uniqueMap.set(linkKey, p);
    }
  });
  data = Array.from(uniqueMap.values());

  renderSummary(data);
  updateLastUpdatedTime(); // เรียกอัปเดตเวลาตรงนี้ทำงานถูกต้องแล้วครับ

  let processedData = [...data];

  if(sort === "sheet_desc" || sort === "default" || !sort){
    processedData.reverse();
  }

  if(selectedPlatform !== "all"){
    processedData = processedData.filter(p => p.platform === selectedPlatform);
  }

  processedData.forEach(p => {
    p.eng =
      Number(p.likes || 0) +
      Number(p.comments || 0) +
      Number(p.shares || 0) +
      Number(p.reposts || 0);
  });

  const sortFunc = (a, b) => {
    switch(sort){
      case "eng_desc": return b.eng - a.eng;
      case "eng_asc": return a.eng - b.eng;
      case "sheet_asc": return -1;
      case "sheet_desc": 
      default: return 0;
    }
  };

  let linglingData = processedData.filter(p => classifySubCategory(p) === "lingling");
  let brandData = processedData.filter(p => classifySubCategory(p) === "brand");
  let mediaData = processedData.filter(p => classifySubCategory(p) === "media");

  if(sort === "eng_desc" || sort === "eng_asc") {
    linglingData.sort(sortFunc);
    brandData.sort(sortFunc);
    mediaData.sort(sortFunc);
  } else {
    sortDataByPlatform(linglingData);
    sortDataByPlatform(brandData);
  }

  const linglingHeader = document.getElementById("linglingSectionHeader");
  const linglingContent = document.getElementById("linglingContent");
  const brandHeader = document.getElementById("brandSectionHeader");
  const brandContent = document.getElementById("brandContent");
  const mediaHeader = document.getElementById("mediaSectionHeader");
  const mediaCont = document.getElementById("mediaContent");

  if(currentType === "lingling"){
    if(linglingHeader) linglingHeader.style.display = "block";
    if(linglingContent) {
      linglingContent.style.display = "grid";
      linglingContent.className = "grid-horizontal";
    }
    if(brandHeader) brandHeader.style.display = "none";
    if(brandContent) { brandContent.style.display = "none"; brandContent.innerHTML = ""; }
    if(mediaHeader) mediaHeader.style.display = "none";
    if(mediaCont) mediaCont.innerHTML = "";
    renderCards(linglingData, "linglingContent", false, "lingling");
  } else if(currentType === "brand"){
    if(linglingHeader) linglingHeader.style.display = "none";
    if(linglingContent) { linglingContent.style.display = "none"; linglingContent.innerHTML = ""; }
    if(brandHeader) brandHeader.style.display = "block";
    if(brandContent) brandContent.style.display = "block";
    if(mediaHeader) mediaHeader.style.display = "none";
    if(mediaCont) mediaCont.innerHTML = "";
    renderGroupedBrand(brandData, brandContent);
  } else if(currentType === "media"){
    if(linglingHeader) linglingHeader.style.display = "none";
    if(linglingContent) { linglingContent.style.display = "none"; linglingContent.innerHTML = ""; }
    if(brandHeader) brandHeader.style.display = "none";
    if(brandContent) { brandContent.style.display = "none"; brandContent.innerHTML = ""; }
    if(mediaHeader) mediaHeader.style.display = "flex";
    if(mediaCont) mediaCont.style.display = "block";
    renderGroupedMedia(mediaData, mediaCont);
  } else {
    if(linglingHeader) linglingHeader.style.display = "block";
    if(linglingContent) {
      linglingContent.style.display = "flex";
      linglingContent.className = "grid-horizontal";
    }
    if(brandHeader) brandHeader.style.display = "block";
    if(brandContent) brandContent.style.display = "block";
    if(mediaHeader) mediaHeader.style.display = "flex";
    if(mediaCont) mediaCont.style.display = "block";
    renderCards(linglingData, "linglingContent", false, "lingling");
    renderGroupedBrand(brandData, brandContent);
    renderGroupedMedia(mediaData, mediaCont);
  }

  updateProgress();
}

function renderSummary(dataset){
  let linglingCount = 0;
  let brandCount = 0;
  let mediaCount = 0;
  let linglingLikes = 0;
  let linglingViews = 0;
  let linglingTotalEng = 0;

  // 1. กรองเฉพาะโพสต์ของ lingling และเอาเฉพาะแพลตฟอร์ม Instagram (ไม่เอา TikTok)
  let linglingPosts = dataset.filter(p => {
    const isLingling = classifySubCategory(p) === "lingling";
    const plat = (p.platform || "").toLowerCase();
    const isInstagram = plat.includes("instagram") || plat.includes("ig");
    return isLingling && isInstagram;
  });

  linglingCount = linglingPosts.length;

  // 2. ตัดโพสต์แรกออกด้วย slice(1)
  let linglingPostsToCalc = linglingPosts.slice(1);

  // 3. คำนวณแยกแต่ละตัวแปร
  linglingPostsToCalc.forEach(p => {
    const likes = Number(p.likes || 0);
    const comments = Number(p.comments || 0);
    const shares = Number(p.shares || 0);
    const reposts = Number(p.reposts || 0);
    const views = Number(p.views || 0);

    linglingLikes += likes;
    linglingViews += views;
    
    // Total คำนวณจาก Engagement ทั้งหมดรวมกัน (Likes + Comments + Shares + Reposts + Views)
    linglingTotalEng += (likes + comments + shares + reposts + views);
  });

  dataset.forEach(p => {
    const sub = classifySubCategory(p);
    if(sub === "brand") brandCount++;
    else if(sub === "media") mediaCount++;
  });

  if(document.getElementById("countLingling")) {
    document.getElementById("countLingling").innerText = linglingCount.toLocaleString();
    document.getElementById("countBrand").innerText = brandCount.toLocaleString();
    document.getElementById("countMedia").innerText = mediaCount.toLocaleString();
  }

  // อัปเดตค่าแสดงผลแยกแต่ละช่องตามหน้า engagement.html
  const likesEl = document.getElementById("linglingTotalLikes");
  const viewsEl = document.getElementById("linglingTotalViews");
  const combinedEl = document.getElementById("linglingTotalCombined");

  if (likesEl) likesEl.innerText = linglingLikes.toLocaleString();
  if (viewsEl) viewsEl.innerText = linglingViews.toLocaleString();
  if (combinedEl) combinedEl.innerText = linglingTotalEng.toLocaleString();
}

function getPlatformIcon(platform){
  if(!platform) return "";
  const p = platform.toLowerCase();
  if(p.includes("tiktok")){
    return "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg";
  }
  if(p.includes("instagram") || p.includes("ig")){
    return "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg";
  }
  if(p === "facebook" || p === "fb"){
    return "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg";
  }
  if(p === "x" || p.includes("twitter")){
    return "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg";
  }
  return "";
}

function getReviewedPosts(){
  return JSON.parse(localStorage.getItem("reviewedPosts") || "[]");
}

function saveReviewedPosts(list){
  localStorage.setItem("reviewedPosts", JSON.stringify(list));
}

function markAsReviewed(id){
  let reviewed = getReviewedPosts();
  if(!reviewed.includes(id)){
    reviewed.push(id);
    saveReviewedPosts(reviewed);
  }
  updateProgressVisuals();
}

function resetProgress() {
  if (confirm("คุณต้องการรีเซ็ตสถานะการเปิดโพสต์ทั้งหมดใช่หรือไม่?")) {
    localStorage.removeItem("reviewedPosts");
    updateProgressVisuals();
    if (globalRawDataset.length > 0) render(globalRawDataset);
  }
}

function handleOpen(element, link, postId){
  window.open(link, '_blank');
  markAsReviewed(postId);
  element.classList.add("opened");
  const btn = element.querySelector("button.action-btn");
  if(btn) btn.classList.add("opened");
}

function updateProgressVisuals(){
  const reviewed = getReviewedPosts();
  let totalPosts = globalRawDataset.length;
  let reviewedCount = globalRawDataset.filter(p => reviewed.includes(p.link)).length;

  const reviewCountEl = document.getElementById("reviewCount");
  if (reviewCountEl) {
    reviewCountEl.innerText = reviewedCount + " / " + totalPosts;
  }

  const progressFillEl = document.getElementById("progressFill");
  if (progressFillEl) {
    const percent = totalPosts ? (reviewedCount / totalPosts) * 100 : 0;
    progressFillEl.style.width = percent + "%";
  }
}

function updateProgress(){
  updateProgressVisuals();
}

function createPostQuestHTML(p) {
  const metrics = [
    { key: 'likes', label: 'Likes', val: Number(p.likes || 0) },
    { key: 'comments', label: 'Comments', val: Number(p.comments || 0) },
    { key: 'reposts', label: 'Reposts', val: Number(p.reposts || 0) },
    { key: 'shares', label: 'Shared', val: Number(p.shares || 0) },
    { key: 'views', label: 'Views', val: Number(p.views || 0) }
  ];

  let rowsHTML = "";
  metrics.forEach(m => {
    const target = POST_TARGETS[m.key];
    let pct = (m.val / target) * 100;
    if (pct > 100) pct = 100;

    rowsHTML += `
      <div class="pq-row">
        <span>${m.label}</span>
        <div class="pq-bar-bg">
          <div class="pq-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="pq-val">${m.val.toLocaleString()}/${target.toLocaleString()}</span>
      </div>
    `;
  });

  return `
    <div class="post-quest-box">
      <div class="post-quest-title">
        <span>🎯 Post Target Mission</span>
        <span>${((metrics.reduce((acc, m) => acc + Math.min((m.val / POST_TARGETS[m.key]) * 100, 100), 0)) / 5).toFixed(0)}%</span>
      </div>
      ${rowsHTML}
    </div>
  `;
}

function renderCards(data, containerId, isCompact, categoryType){
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const reviewed = getReviewedPosts();

  if(!data || data.length === 0){
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Posts Found</h3>
        <p>No Post Found</p>
      </div>
    `;
    return;
  }

  data.forEach(p => {
    const postId = p.link;
    const isOpened = reviewed.includes(postId);
    const iconURL = getPlatformIcon(p.platform);

    const titleHTML = `
      <div class="platform-title">
        ${iconURL ? `<img class="platform-icon" src="${iconURL}">` : ""}
        <span>${p.post_name || ''}</span>
      </div>
    `;

    const imageHTML = p.thumbnail ? `<img class="post-img" src="${p.thumbnail || ''}" loading="lazy">` : "";
    const postQuestHTML = createPostQuestHTML(p);

    container.innerHTML += `
      <div class="card">
        <div>
          ${imageHTML}
          <div class="badge artist">00K</div>
          ${titleHTML}
          ${postQuestHTML}
        </div>
        <button class="action-btn ${isOpened ? "opened" : ""}" onclick="handleOpen(this, '${p.link}', '${postId}')">
          ${isOpened ? "Opened" : "Open Post"}
        </button>
      </div>
    `;
  });
}

function changeBrandPage(platformKey, page) {
  brandPages[platformKey] = page;
  if (globalRawDataset.length > 0) render(globalRawDataset);
}

function changeMivPage(platformKey, newPage) {
  mivPages[platformKey] = newPage;
  if (globalRawDataset.length > 0) render(globalRawDataset); 
}

function renderGroupedBrand(data, container) {
  if (!container) return;
  container.innerHTML = "";
  const reviewed = getReviewedPosts();

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="width: 92%; margin: 0 auto;">
        <h3>No Posts Found</h3>
        <p>No Posts Found</p>
      </div>
    `;
    return;
  }

  const groups = {};
  data.forEach(p => {
    const plat = (p.platform || "Other").trim();
    if (!groups[plat]) groups[plat] = [];
    groups[plat].push(p);
  });

  const sortedPlatforms = Object.keys(groups).sort((a, b) => {
    let platA = a.toLowerCase();
    let platB = b.toLowerCase();
    let indexA = platformOrder.findIndex(p => platA.includes(p.toLowerCase()));
    let indexB = platformOrder.findIndex(p => platB.includes(p.toLowerCase()));
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    return indexA - indexB;
  });

  sortedPlatforms.forEach(platformName => {
    let posts = groups[platformName];
    const platformKey = "brand_" + n(platformName);

    if (!brandPages[platformKey]) brandPages[platformKey] = 1;
    const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
    if (brandPages[platformKey] > totalPages) brandPages[platformKey] = totalPages || 1;

    const currentPage = brandPages[platformKey];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentPosts = posts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const subContainer = document.createElement("div");
    subContainer.className = "platform-sub-container";

    let buttonsHTML = "";
    currentPosts.forEach(p => {
      const postId = p.link;
      const isOpened = reviewed.includes(postId);
      const postName = p.post_name || "Brand Post";

      buttonsHTML += `
        <button 
          class="brand-btn ${isOpened ? "opened" : ""}"
          onclick="handleOpen(this,'${p.link}','${postId}')"
          title="${postName}">
          <span class="badge brand" style="margin:0; font-size:9px; padding:2px 6px;">BRAND</span>
          <span class="btn-text">${postName}</span>
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </button>
      `;
    });

    let paginationHTML = "";
    if (totalPages > 1) {
      paginationHTML += `<div class="pagination">`;
      paginationHTML += `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="changeBrandPage('${platformKey}', ${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
      
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
          paginationHTML += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="changeBrandPage('${platformKey}', ${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
          paginationHTML += `<span style="color:#fff; font-size:11px;">...</span>`;
        }
      }

      paginationHTML += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="changeBrandPage('${platformKey}', ${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
      paginationHTML += `</div>`;
    }

    subContainer.innerHTML = `
      <div class="platform-sub-title">
        <span>Brand & Official - ${platformName} (${posts.length} posts)</span>
      </div>
      <div class="grid-compact">
        ${buttonsHTML}
      </div>
      ${paginationHTML}
    `;

    container.appendChild(subContainer);
  });
}

function renderGroupedMedia(data, container) {
  if (!container) return;
  container.innerHTML = "";

  const reviewed = getReviewedPosts();
  const soloFilterVal = document.getElementById("soloFilter") ? document.getElementById("soloFilter").value : "all";

  if (soloFilterVal === "solo") {
    data = data.filter(p => {
      const isSolo = String(p.is_solo || "").trim().toLowerCase() === "true" || 
                     String(p.is_solo || "").trim() === "1" || 
                     String(p.is_solo || "").trim().toLowerCase() === "yes";
      return isSolo;
    });
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="width: 92%; margin: 0 auto;">
        <h3>No Posts Found</h3>
        <p>No Posts Found</p>
      </div>
    `;
    return;
  }

  const groups = {};
  data.forEach(p => {
    const plat = (p.platform || "Other").trim();
    if (!groups[plat]) {
      groups[plat] = [];
    }
    groups[plat].push(p);
  });

  const sortedPlatforms = Object.keys(groups).sort((a, b) => {
    let platA = a.toLowerCase();
    let platB = b.toLowerCase();
    
    let indexA = platformOrder.findIndex(p => platA.includes(p.toLowerCase()));
    let indexB = platformOrder.findIndex(p => platB.includes(p.toLowerCase()));
    
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    
    return indexA - indexB;
  });

  sortedPlatforms.forEach(platformName => {
    let posts = groups[platformName];
    const platformKey = n(platformName);

    posts.sort((a, b) => {
      const aImp = String(a.is_important || "").trim().toLowerCase() === "true" || String(a.is_important || "").trim() === "1" || String(a.is_important || "").trim().toLowerCase() === "yes";
      const bImp = String(b.is_important || "").trim().toLowerCase() === "true" || String(b.is_important || "").trim() === "1" || String(b.is_important || "").trim().toLowerCase() === "yes";
      
      if (aImp && !bImp) return -1;
      if (!aImp && bImp) return 1;
      return 0;
    });

    if (!mivPages[platformKey]) {
      mivPages[platformKey] = 1;
    }

    const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
    if (mivPages[platformKey] > totalPages) {
      mivPages[platformKey] = totalPages || 1;
    }

    const currentPage = mivPages[platformKey];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentPosts = posts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const subContainer = document.createElement("div");
    subContainer.className = "platform-sub-container";

    let buttonsHTML = "";
    currentPosts.forEach(p => {
      const postId = p.link;
      const isOpened = reviewed.includes(postId);
      const postName = p.post_name || "Open Post";

      const isImportant = String(p.is_important || "").trim().toLowerCase() === "true" || 
                          String(p.is_important || "").trim() === "1" || 
                          String(p.is_important || "").trim().toLowerCase() === "yes";

      const isSolo = String(p.is_solo || "").trim().toLowerCase() === "true" || 
                     String(p.is_solo || "").trim() === "1" || 
                     String(p.is_solo || "").trim().toLowerCase() === "yes";

      let badgeHTML = "";
      let btnClassExtra = "";

      if (isImportant) {
        badgeHTML = '<span class="miv-badge-highlight">BOOST!</span>';
        btnClassExtra = "highlight-media";
      } else if (isSolo) {
        badgeHTML = '<span class="miv-badge-solo">SOLO</span>';
        btnClassExtra = "highlight-solo";
      }

      buttonsHTML += `
        <button 
          class="miv-btn ${isOpened ? "opened" : ""} ${btnClassExtra}"
          onclick="handleOpen(this,'${p.link}','${postId}')"
          title="${postName}">
          ${badgeHTML}
          <span class="btn-text">${postName}</span>
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </button>
      `;
    });

    let paginationHTML = "";
    if (totalPages > 1) {
      paginationHTML += `<div class="pagination">`;
      paginationHTML += `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="changeMivPage('${platformKey}', ${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
      
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
          paginationHTML += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="changeMivPage('${platformKey}', ${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
          paginationHTML += `<span style="color:#fff; font-size:11px;">...</span>`;
        }
      }

      paginationHTML += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="changeMivPage('${platformKey}', ${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
      paginationHTML += `</div>`;
    }

    subContainer.innerHTML = `
      <div class="platform-sub-title">
        <span>${platformName} (${posts.length} posts)</span>
      </div>
      <div class="grid-compact">
        ${buttonsHTML}
      </div>
      ${paginationHTML}
    `;

    container.appendChild(subContainer);
  });
}

async function updateLastUpdatedTime() {
  const timeEl = document.getElementById("lastUpdatedTime");
  if (!timeEl) return;
  
  try {
    const response = await fetch("https://api.github.com/repos/lingigupdate-code/00K-Engagement/commits?path=data/data-ckss27.json&per_page=1");
    if (!response.ok) throw new Error("API error");
    
    const commits = await response.json();
    if (commits && commits.length > 0) {
      const commitDate = new Date(commits[0].commit.committer.date);
      
      const timeString = commitDate.toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Bangkok', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      const dateString = commitDate.toLocaleDateString('en-US', { 
        timeZone: 'Asia/Bangkok', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      timeEl.innerText = `${dateString}, ${timeString} (Bangkok)`;
    } else {
      timeEl.innerText = "No update data";
    }
  } catch (err) {
    console.error("Failed to fetch last commit time:", err);
    timeEl.innerText = "Unable to load time";
  }
}
