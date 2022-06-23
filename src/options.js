const textArea = document.getElementById("textTwilioAccounts");
const button = document.getElementById("btnSave");
const alertError = document.getElementById("alertError");

const validate = (value) => {
  if (!value) {
    throw new Error("Value shouldn't be empty.");
  }
  const rows = value.split("\n");
  if (!rows) {
    throw new Error("Please put correct lists");
  }
  rows.forEach((row) => {
    const cols = row.split(",");
    if (!cols || cols.length < 2) {
      throw new Error("Please put correct lists");
    }
  });
};

button.addEventListener("click", () => {
  alertError.classList.add("hidden");
  try {
    validate(textArea.value);
    chrome.storage.sync.set({ twilioAccounts: textArea.value });
  } catch (e) {
    console.error(e);
    alertError.innerText = e.message;
    alertError.classList.remove("hidden");
  }
});

chrome.storage.sync.get("twilioAccounts", ({ twilioAccounts }) => {
  textTwilioAccounts.value = twilioAccounts || "";
});
