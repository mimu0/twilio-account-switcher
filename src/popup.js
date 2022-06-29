let changeColor = document.getElementById("changeColor");
const selectTwilioAccounts = document.getElementById("selectTwilioAccounts");
const textAccountSid = document.getElementById("textAccountSid");
const btnSwitch = document.getElementById("btnSwitch");
const btnGo = document.getElementById("btnGo");

chrome.storage.sync.get("twilioAccounts", ({ twilioAccounts }) => {
  if (!twilioAccounts) {
    return;
  }
  twilioAccounts.split("\n").forEach((row) => {
    if (!row) {
      return;
    }
    const cols = row.split(",");
    const option = document.createElement("option");
    option.text = cols[0];
    option.value = cols[1];
    selectTwilioAccounts.appendChild(option);
  });
});

btnSwitch.addEventListener("click", async () => {
  const accountSid = selectTwilioAccounts.value;
  await switchAccount(accountSid);
});

btnGo.addEventListener("click", async () => {
  const accountSid = textAccountSid.value;
  await switchAccount(accountSid);
});

const switchAccount = async (accountSid) => {
  if (!accountSid) {
    return;
  }

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url?.includes("https://console.twilio.com")) {
    alert("Extension only works with Twilio console tab.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [accountSid],
    func: runSwitchAccount,
  });
};

/*
This function will run on other browser context
*/
const runSwitchAccount = async (accountSid) => {
  const doRequest = async (url, options) => {
    return fetch(
      url,
      Object.assign(
        {
          method: "get",
          redirect: "follow",
          credentials: "include",
        },
        options
      )
    );
  };

  try {
    const res = await doRequest("https://www.twilio.com/api/csrf");
    const data = await res.json();
    await doRequest(
      `https://www.twilio.com/console/projects/summary/${accountSid}`,
      {
        method: "post",
        headers: {
          "x-twilio-csrf": data.csrf,
        },
      }
    );
    await doRequest(
      `https://www.twilio.com/console/api/navigation/rpc?name=currentAccountSet&args={"currentAccountSid":"${accountSid}"}`
    );
    await doRequest(
      `https://www.twilio.com/console/account/api/v2/switch/${accountSid}`
    );

    document.location.reload();
  } catch (e) {
    console.error(e);
  }
};
