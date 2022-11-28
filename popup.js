const docList  = document.getElementById("codaDocs");
const tabList  = document.getElementById("codaTables");
const notify  = document.getElementById("notify");
const headers1 = {'Authorization': 'Bearer 9888df89-1114-48f8-8aed-c746f19e6705'};
const whoAmI   = document.getElementById("whoAmI");
const addNote  = document.getElementById("addNote");
const logId    = document.getElementById("logId");
//chrome.storage.local.get("loginId", ({ loginId }) => {logId.innerText = loginId;});

$( document ).ready(async function() {
  await chrome.storage.local.get('isNotifying', ({isNotifying}) => {
      $("#notify").prop( "checked", isNotifying );         
  });
});

async function listCoda(uri) {
  let data = await fetch(uri, headers1)
    .then(response => {return response.json();});
  return data;
}

whoAmI.addEventListener("click", async () => {
  if (await getUserName()) {
    let codaDocuments = await getCodaDocs();
    putDoclist(codaDocuments);
    (docList.value) ? getCodaTables(docList.value) : (tabList.selectedIndex = "0");
  } else {
    createNotification('Coda', 'login to Coda !');
  }    
});

async function getUserName() {
  let who = await listCoda('https://coda.io/apis/v1/whoami');
  if (who.loginId) {
    chrome.storage.local.set({loginId: who.loginId});
    logId.innerText = who.loginId;
    return true;
  } else {    
    return false;
  }
}

async function getCodaDocs() { 
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
  for (let [docid, docname] of Object.entries(codaDocuments)) {
    var x = document.createElement("OPTION");
    x.setAttribute("value", docid);
    x.setAttribute("label", docname);
    docList.appendChild(x);
  }; 
}

async function getCodaTables(docId) {
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

function putTablist(codaTables) {
  while (tabList.options.length) tabList.remove(0);
  for (let [tabid, tabname] of Object.entries(codaTables)) {
    let x = document.createElement("OPTION");
    x.setAttribute("value", tabid);
    x.setAttribute("label", tabname);
    tabList.appendChild(x);
  }
  chrome.storage.local.get('tabId', ({tabId}) => {
    (tabId) ? (tabList.value = tabId) : (chrome.storage.local.set({tabId: tabList.value}));
    //createNotification('tabId', tabList.value);
  });  
}

function getColumn(docId, tabId) {
  fetch(`https://coda.io/apis/v1/docs/${docId}/tables/${tabId}/columns/Notes`, headers1)
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
  if (await getUserName()) {
    await chrome.storage.local.get('codaDocuments', async ({codaDocuments}) => {
      (codaDocuments) ? putDoclist(codaDocuments) : putDoclist(await getCodaDocs());
    });
    await chrome.storage.local.get(
        ['docId', 'codaTables'], async ({docId, codaTables}) => {
          if (docId) {
            docList.value = docId;
            (codaTables) ? putTablist(codaTables) : getCodaTables(docId); 
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
  chrome.storage.local.set({docId: docList.value});
  getCodaTables(docList.value);
};
tabList.onchange = function() {
  //let tabId = tabList.options[tabList.selectedIndex].value; 
  chrome.storage.local.set({tabId: tabList.value});
};
notify.onchange = function() {
  //createNotification(notify.id, notify.checked.toString());
  chrome.storage.local.set({isNotifying: notify.checked});
}