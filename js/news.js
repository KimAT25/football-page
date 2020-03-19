let useLocalStorage = true;
let useMongoDB = false;
let addedNews = document.getElementById('added-list-news');
let storageNews = [];
let db;

const isOnline = () => window.navigator.onLine;

const inintDB = () => {
  let openRequest = indexedDB.open('newsDB');

  openRequest.onupgradeneeded = function() {
    db = openRequest.result;
    db.createObjectStore('newsDB', { keyPath: 'id' });
  };
  openRequest.onerror = function() {
    console.error('Error, fix the bugs!!');
  };

  openRequest.onsuccess = function() {
    db = openRequest.result;
  };
};

const handleConnectionChange = event => {
  if (event.type == 'offline') {
    alert('You lost connection.');
  }

  if (event.type == 'online') {
    alert('You are now back online.');
  }
};

window.addEventListener('online', handleConnectionChange);
window.addEventListener('offline', handleConnectionChange);

class SubmitUserForm {
  constructor(id, firstName, lastName, email, text) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.text = text;
  }
}

if (isOnline()) {
  if (useLocalStorage) {
    saved = JSON.parse(localStorage.getItem('news'));
    if (saved) {
      saved.map(el => {
        let listFromLocalStorage = document.createElement('li');
        listFromLocalStorage.innerHTML += `${el.firstName} ${el.lastName} ${el.email} ${el.text}`;
        addedNews.appendChild(listFromLocalStorage);
      });
      localStorage.clear();
    }
  } else if (useMongoDB) {
    getDataUser();
  } else {
    if (inintDB()) {
      getFromNewsDB();
    }
  }
}

const newsSubmit = e => {
  e.preventDefault();

  let id = Date.now();
  let firstName = document.getElementById('first-name').value;
  let lastName = document.getElementById('last-name').value;
  let email = document.getElementById('email').value;
  let text = document.getElementById('text-area').value;

  const userDataInput = new SubmitUserForm(
    id,
    firstName,
    lastName,
    email,
    text
  );

  if (useLocalStorage) {
    if (isOnline()) {
      let li = document.createElement('li');
      li.innerHTML += `${userDataInput.firstName} 
                        ${userDataInput.lastName}
                        ${userDataInput.email} 
                        ${userDataInput.text}`;
      addedNews.appendChild(li);
    } else {
      storageNews.push(userDataInput);
      localStorage.setItem('news', JSON.stringify(storageNews));
    }
  } else if (useMongoDB) {
    postDataUser(firstName, lastName, email, text);
  } else {
    if (isOnline()) {
      let listDB = document.createElement('li');
      listDB.innerHTML += `${id} 
                            ${firstName} 
                            ${lastName} 
                            ${email} 
                            ${text}`;
      addedNews.appendChild(listDB);
    } else {
      postToNewsDB(id, firstName, lastName, email, text);
    }
  }

  document.querySelector('form').reset();
};

const postDataUser = (firstName, lastName, email, text) => {
  let userData = {
    'first-name': firstName,
    'last-name': lastName,
    email: email,
    text: text
  };
  fetch('http://localhost:3000/news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
};

const getDataUser = () => {
  fetch('http://localhost:3000/news')
    .then(res => {
      return res.json();
    })
    .then(data => {
      data.map(el => {
        let listFromMongoDb = document.createElement('li');
        listFromMongoDb.innerHTML += `${el['first-name']} 
                                      ${el['last-name']} 
                                      ${el.email} 
                                      ${el.text}`;
        addedNews.appendChild(listFromMongoDb);
      });
    });
};

document
  .querySelector('.form-group-news-btn')
  .addEventListener('click', newsSubmit);

function postToNewsDB(id, firstName, lastName, email, text) {
  let transaction = db.transaction('newsDB', 'readwrite');
  let news = transaction.objectStore('newsDB');

  let objectDB = {
    id: `${id}`,
    'first-name': `${firstName}`,
    'last-name': `${lastName}`,
    email: `${email}`,
    text: `${text}`
  };
  news.add(objectDB);
}

function getFromNewsDB() {
  let transaction = db.transaction('newsDB', 'readwrite');
  let news = transaction.objectStore('newsDB');

  let request = news.openCursor();
  request.onsuccess = function() {
    let cursor = request.result;
    if (cursor) {
      let listPostedDB = document.createElement('li');
      listPostedDB.innerHTML += `First Name:${cursor.value['first-name']};
      Last Name:${cursor.value['last-name']};
      email:${cursor.value.email};
      news:${cursor.value.text}`;
      cursor.continue();
      addedNews.appendChild(listPostedDB);
    }
  };
}
