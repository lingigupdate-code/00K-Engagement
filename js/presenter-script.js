// เปลี่ยนมาเรียกใช้ไฟล์ data-presenter.json ในเว็บตัวเอง
const DATA_URL = "data-presenter.json?v=" + Math.floor(Date.now() / (3 * 60 * 60 * 1000));

const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
document.getElementById('current-date-display').innerText = `UPDATE : ${dd}.${mm}.${yyyy}`;

async function fetchPresenters() {
    try {
        const response = await fetch(DATA_URL);
        const data = await response.json();
        
        // อ่านข้อมูลรองรับทุกรูปแบบโครงสร้าง JSON
        const presenters = Array.isArray(data) ? data : (data.presenters || []);
        document.getElementById('loading').style.display = 'none';

        presenters.forEach(item => {
            const rawType = item.Type ? item.Type.toString().trim() : "";
            const targetLink = item.URL || "javascript:void(0)";
            const imageUrl = item.Image_URL || "";
            const brandName = item.Brand || "";

            const cardHTML = `
                <a href="${targetLink}" target="_blank" class="brand-card">
                    <div class="brand-logo-container">
                        <img src="${imageUrl}" class="brand-logo" alt="${brandName}">
                    </div>
                    <div class="brand-name">${brandName}</div>
                </a>
            `;

            const typeId = rawType
                .toLowerCase()
                .replace(/&/g, 'and')
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '');

            const grid = document.getElementById(`grid-${typeId}`);
            const section = document.getElementById(`section-${typeId}`);

            if (grid && section) {
                grid.innerHTML += cardHTML;
                section.classList.add('has-data');
            }

            const isExpired = rawType.toLowerCase().includes('expired') || rawType.toLowerCase().includes('past');
            const isBrandOwner = typeId === 'brand-owner';

            if (!isExpired && !isBrandOwner) {
                const chipHTML = `
                    <a href="${targetLink}" target="_blank" class="ref-brand-chip" title="${brandName}">
                        <img src="${imageUrl}" class="ref-chip-logo" alt="${brandName}">
                    </a>
                `;

                if (typeId === 'global-brand-ambassador') {
                    document.getElementById('row-global-brand-ambassador').innerHTML += chipHTML;
                } else if (typeId === 'brand-ambassador') {
                    document.getElementById('row-brand-ambassador').innerHTML += chipHTML;
                } else if (typeId === 'face-of-apac') {
                    document.getElementById('row-face-of-apac').innerHTML += chipHTML;
                } else if (typeId === 'asean-regional-presenter') {
                    document.getElementById('row-asean-regional-presenter').innerHTML += chipHTML;
                } else if (typeId === 'brand-spokesperson') {
                    document.getElementById('row-brand-spokesperson').innerHTML += chipHTML;
                } else if (typeId === 'friend-of-brand') {
                    document.getElementById('row-friend-of-brand').innerHTML += chipHTML;
                } else if (typeId === 'presenter') {
                    document.getElementById('row-presenter').innerHTML += chipHTML;
                }
            }
        });

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('loading').innerText = "Unable to load data.";
    }
}

function openInfographicModal() {
    document.getElementById('infographic-modal').style.display = 'flex';
}

function closeInfographicModal() {
    document.getElementById('infographic-modal').style.display = 'none';
}

function saveAsImage() {
    const captureElement = document.getElementById('capture-area');
    const floatingActions = document.querySelector('.modal-floating-actions');
    
    floatingActions.style.display = 'none';

    const originalWidth = captureElement.style.width;
    const originalHeight = captureElement.style.height;
    const originalMaxWidth = captureElement.style.maxWidth;
    const originalMaxHeight = captureElement.style.maxHeight;

    captureElement.style.width = '400px';
    captureElement.style.height = '500px';
    captureElement.style.maxWidth = 'none';
    captureElement.style.maxHeight = 'none';

    html2canvas(captureElement, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#fbf9f5',
        logging: false
    }).then(canvas => {
        captureElement.style.width = originalWidth;
        captureElement.style.height = originalHeight;
        captureElement.style.maxWidth = originalMaxWidth;
        captureElement.style.maxHeight = originalMaxHeight;
        
        floatingActions.style.display = 'flex';

        const imageURL = canvas.toDataURL('image/png', 1.0);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        if (isIOS) {
            let existingPreview = document.getElementById('ios-preview-overlay');
            if (existingPreview) existingPreview.remove();

            let overlay = document.createElement('div');
            overlay.id = 'ios-preview-overlay';
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
            
            overlay.innerHTML = `
                <div style="color:#C5A059; font-family:'Montserrat',sans-serif; font-size:12px; margin-bottom:12px; text-align:center; letter-spacing:1px;">กดค้างที่รูปด้านล่างเพื่อบันทึกภาพความชัดสูง</div>
                <img src="${imageURL}" style="max-width:90%; max-height:75vh; border-radius:4px; border:2px solid #C5A059; box-shadow:0 10px 30px rgba(0,0,0,0.8);" />
                <button onclick="document.getElementById('ios-preview-overlay').remove()" style="margin-top:20px; background:#C5A059; color:#000; border:none; padding:10px 30px; border-radius:2px; font-family:'Montserrat',sans-serif; font-weight:700; text-transform:uppercase; cursor:pointer;">ปิดหน้าต่างนี้</button>
            `;
            document.body.appendChild(overlay);
        } else {
            const link = document.createElement('a');
            link.download = 'Lingling-Kwong-Brand-Endorser-2026.png';
            link.href = imageURL;
            link.click();
        }
    }).catch(err => {
        console.error('Error capturing image:', err);
        captureElement.style.width = originalWidth;
        captureElement.style.height = originalHeight;
        captureElement.style.maxWidth = originalMaxWidth;
        captureElement.style.maxHeight = originalMaxHeight;
        floatingActions.style.display = 'flex';
        alert('ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    });
}

window.onload = fetchPresenters;