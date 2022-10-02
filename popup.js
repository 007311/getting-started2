const docList  = document.getElementById("codaDocs");
const tabList  = document.getElementById("codaTables");
const headers1 = {'Authorization': 'Bearer 9888df89-1114-48f8-8aed-c746f19e6705'};
const whoAmI   = document.getElementById("whoAmI");
const addNote  = document.getElementById("addNote");
const logId    = document.getElementById("logId");

chrome.storage.local.get("loginId", ({ loginId }) => {
  logId.innerText = loginId;
});

async function listCoda(uri) {
  let data = await fetch(uri, headers1)
    .then(response => {
      return response.json();
    });
  return data;
}

whoAmI.addEventListener("click", async () => {
  let who = await listCoda('https://coda.io/apis/v1/whoami');
  if (who.loginId) {
    loginId = who.loginId;
    chrome.storage.local.set({ loginId });
    logId.innerText = loginId;
    var codaDocuments = await listDocs();
    chrome.storage.local.set({codaDocuments});
    putDoclist(codaDocuments);
    if (docList.value) {
      listTables(docList.value);
    } else {
      tabList.value = '';
    }

  } else {
    createNotification('Coda', 'login to Coda !');
  }    
});

async function getUserName() {
  let who = await listCoda('https://coda.io/apis/v1/whoami');
  if (who.loginId) {
    let loginId = who.loginId;
    chrome.storage.local.set({ loginId });
    logId.innerText = loginId;
    return true;
  } else {    
    return false;
  }
}

async function listDocs() { 
  let codaDocuments = {};
  let docs = await fetch('https://coda.io/apis/v1/docs', headers1)
    .then(response => {return response.json();});
  docs.items.forEach(item => {
    if (item.type === "doc") {
      Object.defineProperty(codaDocuments, item.id, {
        value: item.name,
        enumerable: true
      });
    }
  });
  chrome.storage.local.set({codaDocuments});
  return codaDocuments;
}

function putDoclist(codaDocuments) {
  while (docList.options.length > 1) docList.remove(0);
  //createNotification('docids', (JSON.stringify(docids)));
  for (let [docid, docname] of Object.entries(codaDocuments)) {
    var x = document.createElement("OPTION");
    x.setAttribute("value", docid);
    x.setAttribute("label", docname);
    docList.appendChild(x);
  }; 
}

async function listTables(docId) {
  let codaTables = {};
  let tabls = await fetch(`https://coda.io/apis/v1/docs/${docId}/tables`, headers1)
    .then((response) => {return response.json();});  
  tabls.items.forEach(item => {
    if (item['tableType'] === "table") {
      Object.defineProperty(codaTables, item.id, {
        value: item.name,
        enumerable: true
      });
    }
  });
  chrome.storage.local.set({codaTables});
  putTablist(codaTables);
}

async function putTablist(codaTables) {
  while (tabList.options.length) tabList.remove(0);
  for (let [tabid, tabname] of Object.entries(codaTables)) {
    let x = document.createElement("OPTION");
    x.setAttribute("value", tabid);
    x.setAttribute("label", tabname);
    tabList.appendChild(x);
  }
  await chrome.storage.local.get('tabId', ({tabId}) => {
    (tabId) ? (tabList.value = tabId) : (chrome.storage.local.set({tabId: tabList.value}));
    createNotification('tabId', tabList.value);
  });  
}

function createNotification(aTitle, theMessage) {
  chrome.notifications.create({
    title: aTitle,
    message: theMessage,
    type: 'basic',
    iconUrl: '/images/coda48.png',
    buttons: [
      { title: 'I Know that' }
    ],
  });
}

document.body.onload = async function() {
  if (getUserName()) {
    await chrome.storage.local.get('codaDocuments', async ({codaDocuments}) => {
      (codaDocuments) ? putDoclist(codaDocuments) : putDoclist(await listDocs());
    });
    await chrome.storage.local.get('docId', async ({docId}) => {
      if (docId) {
        docList.value = docId;
        await chrome.storage.local.get('codaTables', ({codaTables}) => {
          (codaTables) ? putTablist(codaTables) : listTables(docId);
        });
      }
    });
    
  } else {
    logId.innerText = 'no user';
    createNotification('Coda', 'login to Coda !');
    while (docList.options.length) docList.remove(0);
  }
};

docList.onchange = function() {
  //let docId = docList.options[docList.selectedIndex].value; 
  let docId = docList.value;
  chrome.storage.local.set({docId});
  listTables(docId);
};
tabList.onchange = function() {
  //let tabId = tabList.options[tabList.selectedIndex].value; 
  //chrome.storage.local.set({tabId: ''});
  let tabId = tabList.value;
  chrome.storage.local.set({tabId});
};