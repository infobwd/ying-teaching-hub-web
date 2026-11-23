import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../games/logic-equivalence/',import.meta.url);
const html=readFileSync(new URL('index.html',dir),'utf8');
const js=readFileSync(new URL('app.mjs',dir),'utf8');
const style=readFileSync(new URL('style.css',dir),'utf8');
test('strict CSP disallows external connection and external scripts',()=>{
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/script-src 'self'/);
  assert.doesNotMatch(html,/https?:\/\//);
});
test('no network uploads, trackers or remote fonts',()=>{
  assert.doesNotMatch(js,/(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/);
  assert.doesNotMatch(style,/@import|url\(https?:/);
});
test('distinct local device registration and manual share methods',()=>{
  assert.match(js,/localStorage/);
  assert.match(js,/navigator\.share/);
  assert.match(js,/canvas\.toBlob/);
  assert.match(html,/เลขประจำตัวนักเรียน/);
  assert.match(html,/ชื่อจริง/);
  assert.match(html,/นามสกุล/);
  assert.match(html,/ไม่ได้ส่งเข้าฐานครูอัตโนมัติ/);
});
