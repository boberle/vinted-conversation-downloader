const listenForClicks = async () => {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.id;
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => browser.tabs.sendMessage(tabs[0].id, { command }))
        .then(() => (document.querySelector("#error").style.display = "none"))
        .catch(
          () => (document.querySelector("#error").style.display = "block"),
        );
    });
  });
};

browser.tabs.executeScript({ file: "/content_scripts/download.js" }).then(listenForClicks);
