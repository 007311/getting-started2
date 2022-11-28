const menuItems = {
  'addVoca': 'Add vocabulary', 
  'markUp': 'Mark vocabulary', 
  'addNotes': 'Add to notes', 
  'getNote': 'Get Note'
};
const headers1 = {'Authorization': 'Bearer 9888df89-1114-48f8-8aed-c746f19e6705'};
const headers2 = {
  'Content-Type': 'application/json', 
  'Authorization': 'Bearer 9888df89-1114-48f8-8aed-c746f19e6705'
};
let loginId = 'no one';
let docID = chrome.storage.local.get('docId', ({docId}) => {docID = docId});
let tabID = chrome.storage.local.get('tabId', ({tabId}) => {tabID = tabId});
let notesID = chrome.storage.local.get('notesId', ({notesId}) => {notesID = notesId});
let vocaName = '';

let uri = ''; //`https://coda.io/apis/v1/docs/${docID}/tables/${tabID}/rows`;

async function getNotesId() {
  url = `https://coda.io/apis/v1/docs/${docID}/tables/${tabID}/columns/Notes`;
  await fetch(url, headers1)
    .then((response) => {return response.json();})
    .then((result) => {notesID = result.id;})
    .then(chrome.storage.local.set({notesId: notesID}));
  return true;
}
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    (key === 'docId') && (docID = newValue);
    (key === 'tabId') && ((tabID = newValue) && getNotesId());
    (key === 'isNotifying') && (createNotification('isNotifying', newValue.toString()));
    console.log(
      `Storage key "${key}" is changed.`, 
      `OldValue: "${oldValue}", newValue: "${newValue}".`//,
      //`uri is ${uri}`
    );
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  fetch(uri+`/${alarm.name}/buttons/Button`, {method: 'POST', headers: headers1})
  .then((response) => {
    if (response.status == '404') createAlarm(alarm.name, 5000);
  });
});

chrome.runtime.onInstalled.addListener(() => { 
  chrome.contextMenus.create({
    id: 'codaVoca',
    title: 'Coda Vocabulary',
    contexts: ['selection'],
  });
  for (let [mId, mTitle] of Object.entries(menuItems)) {
    chrome.contextMenus.create({
      id: mId,
      title: mTitle,
      parentId: 'codaVoca',
      type: 'normal',
      contexts: ['selection'],
    });
  }
});

chrome.contextMenus.onClicked.addListener( async (item, tab) => {   //remove async?
  let payload = {};
  uri = `https://coda.io/apis/v1/docs/${docID}/tables/${tabID}/rows`;
  switch (item.menuItemId) {
    case 'addVoca':
      payload = {'rows': [{'cells': [{'column': 'Name', 
                                      'value': `${item.selectionText}`},],},],};
      fetch(uri, {method:'POST', headers: headers2, body: JSON.stringify(payload),})
      .then(response => {if (response.status == '202') {
                          createNotification(item.selectionText, "vocabulary is added !");
                          createAlarm(item.selectionText, 15000);
                        }}
        );
      //break;
    case 'markUp':
      vocaName = item.selectionText;
      break;
    case 'pushButt':
      fetch(uri+`/${item.selectionText}/buttons/Button`, {
            method: 'POST', headers: headers1});
      break;    
    case 'addNotes':
      payload = {'row': { 'cells': [{'column': 'Notes', 
                                     'value': `${item.selectionText}`},],},};
      fetch(uri+`/${vocaName}`, {
            method: 'PUT', headers: headers2, body: JSON.stringify(payload)
      });
      break;
    case 'getNote':
      if (!notesID) {getNotesId();}
      fetch(uri+`/${item.selectionText}`, headers1)
      .then((response) => response.json())
      .then((json) => createNotification(item.selectionText, json.values[`${notesID}`]))
      .catch((err) => console.log(err));      
      break; 
  }  
});

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
function createAlarm(alarmName, msDelay) {
  let alarmInfo = {};
  alarmInfo.when = Date.now() + msDelay;
  chrome.alarms.create(alarmName, alarmInfo);
}