var WebsiteUrl;
var WebsiteHostName;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  WebsiteUrl = tabs[0].url;
  WebsiteHostName = new URL(tabs[0].url).hostname;

  document.getElementById("url").innerText = WebsiteHostName;
});

function ShowError(text) {
  var div = document.createElement("div");
  div.setAttribute("id", "ERRORcontainer");
  div.innerHTML = `
      <div class="ERROR" style="color: white;">
            <p>${text}</p>
        </div>`;
  document.getElementsByClassName("bottomItem")[0].appendChild(div);

  setTimeout(() => {
    document.getElementById("ERRORcontainer").remove();
  }, 3000);
}

function displayBlockedWebsites() {
  chrome.storage.local.get("BlockedUrls", (data) => {
    const blockedUrls = data.BlockedUrls || [];

    const blockedList = document.getElementById("blocked-websites");
    blockedList.innerHTML = ""; // Clear previous entries

    blockedUrls.forEach((site) => {
      const li = document.createElement("li");
      li.textContent = `${site.url} - Status: ${site.status}`;
      blockedList.appendChild(li);
    });
  });
}

document.getElementById("btn").addEventListener("click", () => {
  if (WebsiteUrl.toLowerCase().includes("chrome://")) {
    ShowError("You cannot block a chrome URL");
  } else {
    chrome.storage.local.get("BlockedUrls", (data) => {
      let blockedUrls = data.BlockedUrls || [];
      const existingUrl = blockedUrls.find((e) => e.url === WebsiteHostName);

      if (existingUrl) {
        if (existingUrl.status === "In_Progress") {
          ShowError("This URL will be completely blocked after some time");
        } else if (existingUrl.status === "BLOCKED") {
          ShowError("This URL is Blocked completely");
        }
      } else {
        blockedUrls.push({ status: "In_Progress", url: WebsiteHostName });
        chrome.storage.local.set({ BlockedUrls: blockedUrls });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            from: "popup",
            subject: "startTimer",
          });
        });

        setTimeout(() => {
          chrome.storage.local.get("BlockedUrls", (data) => {
            blockedUrls = data.BlockedUrls || [];
            blockedUrls = blockedUrls.map((e) => {
              if (e.url === WebsiteHostName && e.status === "In_Progress") {
                return {
                  status: "BLOCKED",
                  url: WebsiteHostName,
                  BlockTill: new Date().setHours(24, 0, 0, 0),
                };
              }
              return e;
            });

            chrome.storage.local.set({ BlockedUrls: blockedUrls });
            displayBlockedWebsites();
          });
        }, 5000);
      }
    });
  }
});

// Call function to display blocked websites when popup opens
displayBlockedWebsites();
