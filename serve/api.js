module.exports = handleApi;

const { logApiRequest, parseLog } = require('./logger');
const path = process.env.ROOT_PATH || `http://localhost:3000/api/`;
const fs = require('fs');

const genID = (() => {
  let count = 1;
  return () => count++;
})();

const users = require('./db/users.json').map(user => ({ ...user, id: genID()}));

const validator = {
  register({name, username, email, password}) {
    return /^[A-Za-zА-Яа-яІіЇїЄєЁёҐґ ]{2,}$/.test(name) && /^\w{6,}$/.test(username) && /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email) && /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(password);
  }
}

async function handleApi(request, response) {
  const route = request.url.slice(5) || 'endpoints';
  let payload = await router[route]?.(request, response) ?? 'This api is not implemented';
  if (typeof payload === 'object') {
    payload = JSON.stringify(payload);
    response.setHeader('content-type', 'application/json; charset=utf-8');
  }
  logApiRequest(route, payload.length);
  response.end(payload);
}

const router = {
  reset() {
    global.count = 0;
    return 'reset count';
  },
  count() {
    return '' + global.count;
  },
  data() {
    return data;
  },
  // async list(response) {
  //   response.end(JSON.stringify(await makeFileList()));
  // },
  listFiles() {
    return makeFileList();
  },
  uptime() {
    return process.uptime() * 1000 + '';
  },
  endpoints() {
    const routeMap = Object.keys(router).map(route => [route, {
      description: routeDescriptor[route],
      path: path + route
    }]);
    return Object.fromEntries(routeMap);
  },
  async serverLog() {
    const logStr = await fs.promises.readFile('./logs/server.log', 'utf-8');
    return parseLog(logStr);
  },
  async apiLog() {
    const logStr = await fs.promises.readFile('./logs/api.log', 'utf-8');
    return parseLog(logStr);
  },
  async errorLog() {
    const logStr = await fs.promises.readFile('./logs/error.log', 'utf-8').catch(() => '');
    return parseLog(logStr);
  },
  users() {
    return users;
  },
  auth(request) {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      console.log(body);
    })
  },
  async auth(request, response) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const user = users.find((user) => user.username === body.name);
      if (user?.password !== body.password) return { success: false };

      user.token = genToken();
      response.setHeader('set-cookie', 'nws_info_token=' + user.token);
      return { success: true, token: user.token };
    } catch (error) {
      return { errors: ['JSON data only'] };
    }
  },
  async register(request, response) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    try {
      const { name, username, email, password } = JSON.parse(Buffer.concat(chunks).toString());
      if (!name || !username || !email || !password || !validate('register')({ name, username, email, password })) {
        return { errors: ['Invalid data'] };
      }

      const isUsernameOccupied = users.some((user) => user.username === username);
      const isEmailOccupied = users.some((user) => user.email === email);
      if (isUsernameOccupied || isEmailOccupied) return { errors: [...isUsernameOccupied ? ['username is occupied'] : [], ...isEmailOccupied ? ['email is occupied'] : [] ]};
      const id = genID();
      users.push({
        id,
        name,
        username,
        email,
        password,
      });
      fs.promises.writeFile('./serve/db/users.json', JSON.stringify(users, null, 2));
      return { success: true, id };
    } catch (error) {
      return { errors: ['JSON data only'] };
    }
  }
};

const routeDescriptor = {
  reset: 'Reset visit counter',
  count: 'Get visite count',
  data: 'Get cryptocurrencies',
  listFiles: 'Get folder/files structure',
  uptime: 'Get total ms passed from server start',
  endpoints: 'Get list of available endpoints',
  errorLog: 'Show the error history',
  serverLog: 'Show the server activity history',
  apiLog: 'Show the history of API requests',
  users: 'Get list of users',
  auth: 'Authorize and receive token',
};

let count = 0;

let data = [];
getCryptoInfo().then(info => data = info);

async function getCryptoInfo() {
  const buff = await fs.promises.readFile('./serve/data.json');
  const data = JSON.parse(buff);

  return data.map(({ name, percent }) => ({ name, percent }));
}

async function makeFileList(path = '.') {
  const dirContent = await fs.promises.readdir(path, { withFileTypes: true });
  const promises = dirContent.map(async (item) => {
    const children = item.isFile() || item.name.startsWith('.') ? null : await makeFileList(`${path}/${item.name}`);
    return { name: item.name, children }
  });
  return Promise.all(promises);
  // return Promise.all((await fs.promises.readdir(path, { withFileTypes: true })).map(async (item) => ({name: item.name, children: item.isFile() ? null : await makeFileList(`${path}/${item.name}`)})));
}

function rnd(max) {
  return Math.floor(Math.random() * max);
}

function genToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  return Array.from(Array(4), () => Array.from(Array(10), () => chars[rnd(62)]).join('')).join('-');
}

function validate(route) {
  return validator[route];
}

// {
//   let count = 1;
//   var genID = () => count++;
// }