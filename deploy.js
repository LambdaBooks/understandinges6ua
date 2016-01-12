#!/usr/bin/env node

const deploy = require('gh-pages');
const path   = require('path');

const BOOK = '_book';

deploy.publish(path.join(__dirname, BOOK), {
  add: true,
  message: `Update at ${(new Date).toUTCString()}`
}, () => { console.log('Deployed!'); });
