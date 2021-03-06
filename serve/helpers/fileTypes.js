const utf = '; charset=utf-8';
const types = {
  html: 'text/html'+utf,
  htm: 'text/html'+utf,
  svg: 'image/svg+xml'+utf,
  css: 'text/css'+utf,
  js: 'application/javascript'+utf,
  json: 'application/json'+utf,
  xml: 'application/xml'+utf,
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  txt: 'text/plain'+utf,
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  ttf: 'application/font-ttf',
  eot: 'application/vnd.ms-fontobject',
  otf: 'application/font-otf',
  woff: 'application/font-woff',
  wasm: 'application/wasm',
};

function getExtension(str) {
  const index = str.indexOf('.');
  return str.slice(index + 1);
}

module.exports = { types, getExtension };