// dashboard.js
import * as apiClient from "./apiClient.js";

let currentUser = null;

// Load user info
async function loadUserInfo() {
    try {
        const user = await apiClient.getUserInfo();
        currentUser = user;

        // Example: update navbar
        document.getElementById("username").textContent = user.name || "User";
        document.getElementById("userPfp").src = user.pfp || "/default.png";
    } catch (err) {
        console.error("User info failed:", err);
    }
}

// Load downloads
async function loadDownloads() {
    try {
        const downloads = await apiClient.getDownloads();
        updateDownloadHistory(downloads);
    } catch (err) {
        console.error("Downloads failed:", err);
    }
}

// Update downloads UI
function updateDownloadHistory(downloads) {
    const container = document.getElementById("downloadsContainer");
    container.innerHTML = "";

    downloads.forEach(d => {
        const item = document.createElement("div");
        item.className = "download-item";
        item.innerHTML = `
            <img src="${d.youtubeThumbnail || '/placeholder.png'}" alt="thumb" />
            <div>
                <p><strong>${d.youtubeTitle}</strong></p>
                <p>${d.status} - ${d.fileSize || ""}</p>
                <button data-id="${d.id}" class="downloadBtn">⬇️</button>
                <button data-id="${d.id}" class="deleteBtn">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });

    // Wire buttons
    container.querySelectorAll(".downloadBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
            try {
                const blob = await apiClient.downloadFile(btn.dataset.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "file";
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Download failed:", err);
            }
        });
    });

    container.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
            try {
                await apiClient.deleteDownload(btn.dataset.id);
                loadDownloads(); // refresh
            } catch (err) {
                console.error("Delete failed:", err);
            }
        });
    });
}

// Handle download form
async function handleDownloadSubmit(event) {
    event.preventDefault();
    const url = document.getElementById("downloadUrl").value;
    const type = document.querySelector("input[name='fileType']:checked").value;

    try {
        const result = await apiClient.startDownload({ url, type });
        console.log("Started download:", result);
        loadDownloads();
    } catch (err) {
        console.error("Start download failed:", err);
    }
}

// Init page
document.addEventListener("DOMContentLoaded", () => {
    loadUserInfo();
    loadDownloads();
    document.getElementById("downloadForm").addEventListener("submit", handleDownloadSubmit);
});
