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

function loadCaptionSourceData() {
  let rawData = null;
  if (typeof defaultData !== 'undefined') {
      rawData = defaultData;
  } else if (typeof data !== 'undefined') {
      rawData = data;
  } else if (typeof captionsData !== 'undefined') {
      rawData = captionsData;
  }

  if (rawData) {
      globalCaptionsData = rawData.captions || (Array.isArray(rawData) ? rawData : []);
      globalHashtagData = rawData.hashtags || [];
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
  loadCaptionSourceData();
  const display = document.getElementById('widgetCaptionDisplay');
  
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
  const text = document.getElementById('widgetCaptionDisplay').innerText;
  if (!text || text.includes("No Found")) return;
  
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  });
}

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
      'onReady': function() {
        playerReady = true;
      }
    }
  });
}

function playMusic(){
  if(playerReady){
    player.playVideo();
  } else {
    console.log("Player not ready yet");
  }
}

// ตั้งค่า Cache สำหรับหน้า CKSS27
const CACHE_KEY = "00k_ckss27_cache";
const CACHE_TIME_KEY = "00k_ckss27_cache_time";
const THREE_HOURS = 3 * 60 * 60 * 1000;

// 🎯 ปรับปรุงใหม่: ดึงข้อมูลแคปชันและแฮชแท็กจาก data-index.json โดยตรง
async function loadCaptionSourceData() {
  try {
    const response = await fetch('data-index.json?v=' + Date.now());
    if (!response.ok) throw new Error("ไม่สามารถโหลดไฟล์ data-index.json ได้");
    
    const d = await response.json();
    globalCaptionsData = d.captions || [];
    globalHashtagData = d.hashtags || [];
    
    // สุ่มแสดงผลใน Widget ทันทีหลังจากโหลดข้อมูลเสร็จ
    generateWidgetCaption();
  } catch (err) {
    console.error("Failed to load caption source data from JSON:", err);
    const display = document.getElementById('widgetCaptionDisplay');
    if (display) {
      display.innerText = "ไม่สามารถโหลดข้อมูลแคปชันได้";
    }
  }
}

function populatePlatformFilter(data){
  const select=document.getElementById("platformFilter");
  if (!select) return;
  const currentValue=select.value;
  select.innerHTML='<option value="all">All Platforms</option>';
  const platforms=[...new Set(data.map(p=>p.platform?.trim()))];
  platforms.forEach(p=>{
    if(!p)return;
    const option=document.createElement("option");
    option.value=p;
    option.textContent=p;
    select.appendChild(option);
  });
  select.value=currentValue||"all";
}

// 🎯 ปรับแต่งการจำแนกหมวดหมู่ย่อยให้รองรับโครงสร้าง JSON ใหม่แบบ 100%
function classifySubCategory(p) {
  const tabName = (p.sourceTab || p.sheetTab || p.tabName || "").toString().trim().toLowerCase();
  const type = (p.sheetType || "").toString().trim().toLowerCase();
  
  // 1. ตรวจสอบว่าเป็นหมวด Media & KOL หรือไม่
  if (type === "media" || tabName.includes("media") || tabName.includes("kol")) {
    return "media";
  }

  // 2. ถ้าเป็น Artist / Brand ให้จำแนกว่าเป็น Lingling หรือ Brand Official
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

  const selectedPlatform=document.getElementById("platformFilter") ? document.getElementById("platformFilter").value : "all";
  const sort=document.getElementById("sortSelect") ? document.getElementById("sortSelect").value : "default";

  const uniqueMap = new Map();
  data.forEach(p => {
    const linkKey = String(p.link || "").trim();
    if (linkKey && !uniqueMap.has(linkKey)) {
      uniqueMap.set(linkKey, p);
    }
  });
  data = Array.from(uniqueMap.values());

  renderSummary(data);

  let processedData = [...data];

  if(sort === "sheet_desc" || sort === "default" || !sort){
    processedData.reverse();
  }

  if(selectedPlatform!=="all"){
    processedData=processedData.filter(p=>p.platform===selectedPlatform);
  }

  processedData.forEach(p=>{
    p.eng =
      Number(p.likes||0) +
      Number(p.comments||0) +
      Number(p.shares||0) +
      Number(p.reposts||0);
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
    if (linglingHeader) linglingHeader.style.display = "block";
    if (linglingContent) linglingContent.style.display = "grid";
    if (brandHeader) brandHeader.style.display = "none";
    if (brandContent) { brandContent.style.display = "none"; brandContent.innerHTML = ""; }
    if (mediaHeader) mediaHeader.style.display = "none";
    if (mediaCont) mediaCont.innerHTML = "";
    renderCards(linglingData, "linglingContent", false, "lingling");
  } else if(currentType === "brand"){
    if (linglingHeader) linglingHeader.style.display = "none";
    if (linglingContent) { linglingContent.style.display = "none"; linglingContent.innerHTML = ""; }
    if (brandHeader) brandHeader.style.display = "block";
    if (brandContent) brandContent.style.display = "block";
    if (mediaHeader) mediaHeader.style.display = "none";
    if (mediaCont) mediaCont.innerHTML = "";
    renderGroupedBrand(brandData, brandContent);
  } else if(currentType === "media"){
    // 🟢 แก้ไขจุดนี้ให้เปิดการแสดงผล Media Header และ Media Content
    if (linglingHeader) linglingHeader.style.display = "none";
    if (linglingContent) { linglingContent.style.display = "none"; linglingContent.innerHTML = ""; }
    if (brandHeader) brandHeader.style.display = "none";
    if (brandContent) { brandContent.style.display = "none"; brandContent.innerHTML = ""; }
    if (mediaHeader) mediaHeader.style.display = "flex";
    if (mediaCont) mediaCont.style.display = "block";
    renderGroupedMedia(mediaData, mediaCont);
  } else {
    if (linglingHeader) linglingHeader.style.display = "block";
    if (linglingContent) { linglingContent.style.display = "grid"; }
    if (brandHeader) brandHeader.style.display = "block";
    if (brandContent) { brandContent.style.display = "block"; }
    if (mediaHeader) mediaHeader.style.display = "flex";
    if (mediaCont) mediaCont.style.display = "block";
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

  dataset.forEach(p => {
    const sub = classifySubCategory(p);
    if(sub === "lingling") linglingCount++;
    else if(sub === "brand") brandCount++;
    else if(sub === "media") mediaCount++;
  });

  if(document.getElementById("countLingling")) {
    document.getElementById("countLingling").innerText = linglingCount.toLocaleString();
    document.getElementById("countBrand").innerText = brandCount.toLocaleString();
    document.getElementById("countMedia").innerText = mediaCount.toLocaleString();
  }
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
    loadData();
  }
}

function handleOpen(element, link, postId){
  window.open(link,'_blank');
  markAsReviewed(postId);
  element.classList.add("opened");
  const btn = element.querySelector("button.action-btn");
  if(btn) btn.classList.add("opened");
}

function updateProgressVisuals(){
  const reviewed = getReviewedPosts();
  
  const uniqueMap = new Map();
  globalRawDataset.forEach(p => {
    const linkKey = String(p.link || "").trim();
    if (linkKey && !uniqueMap.has(linkKey)) {
      uniqueMap.set(linkKey, p);
    }
  });
  const currentDataset = Array.from(uniqueMap.values());

  let totalPosts = currentDataset.length;
  let reviewedCount = currentDataset.filter(p => reviewed.includes(p.link)).length;

  if (document.getElementById("reviewCount")) {
    document.getElementById("reviewCount").innerText = reviewedCount + " / " + totalPosts;
  }

  const percent = totalPosts ? (reviewedCount / totalPosts) * 100 : 0;
  if (document.getElementById("progressFill")) {
    document.getElementById("progressFill").style.width = percent + "%";
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
  const container=document.getElementById(containerId);
  if (!container) return;
  container.innerHTML="";
  const reviewed = getReviewedPosts();

  if(!data || data.length===0){
    container.innerHTML=`
      <div class="empty-state">
        <h3>No Posts Found</h3>
        <p>No Post Found</p>
      </div>
    `;
    return;
  }

  data.forEach(p=>{
    const postId = p.link;
    const isOpened = reviewed.includes(postId);
    const iconURL = getPlatformIcon(p.platform);

    const titleHTML = `
      <div class="platform-title">
        ${iconURL ? `<img class="platform-icon" src="${iconURL}">` : ""}
        <span>${p.post_name||''}</span>
      </div>
    `;

    const imageHTML = p.thumbnail ? `<img class="post-img" src="${p.thumbnail || ''}">` : "";
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
  render(globalRawDataset);
}

function changeMivPage(platformKey, newPage) {
  mivPages[platformKey] = newPage;
  render(globalRawDataset); 
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
          class="miv-btn ${isOpened ? "opened" : ""}"
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

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
  loadCaptionSourceData();
  generateWidgetCaption();
  loadData();
});
