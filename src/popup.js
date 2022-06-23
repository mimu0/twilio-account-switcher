let changeColor = document.getElementById("changeColor");
const selectTwilioAccounts = document.getElementById("selectTwilioAccounts");
const btnSwitch = document.getElementById("btnSwitch");

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
});

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

/*
preprod,ACf1416ae213f97f1dc6a381ccfef230ae
production,AC94052e3911d77dee229fa8c03a6022ba
stg01-ujetautosmokeminiprd01,ACd5197fe69122497f057e3bb132bb3881
stg01-annmur,AC6cdb1dac0b06a3132b4f5af7366bb27a

https://www.twilio.com/console/api/navigation/rpc?name=currentAccountSet&args={"currentAccountSid":"ACf1416ae213f97f1dc6a381ccfef230ae"}
*/
