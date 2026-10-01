import {CompressionStream, DecompressionStream} from 'node:stream/web';
import {TextEncoder, TextDecoder} from 'node:util';
import {atob,btoa} from 'node:buffer';
import {Blob} from 'node:buffer';
// A deliberately small DOM adapter for deterministic logic tests, not browser or layout QA.
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
export function environment(){
  let frameId=0;const frames=new Map(),timers=new Map(),downloads=[],clipboard=[];let timerId=0;
  class Element {
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.listeners={};this.hidden=false;this.disabled=false;this.checked=false;this.value='';this.type='';this._text='';this.clientWidth=1200;this.parentNode=null;
      this.classList={add:(...names)=>{this.className=[...new Set([...(this.className||'').split(' '),...names])].filter(Boolean).join(' ')},remove:(...names)=>{this.className=(this.className||'').split(' ').filter(n=>!names.includes(n)).join(' ')},toggle:(name,on)=>{if(on??!(this.className||'').split(' ').includes(name))this.classList.add(name);else this.classList.remove(name)}};
    }
    append(...nodes){for(let n of nodes){if(typeof n==='string')n=document.createTextNode(n);n.parentNode=this;this.children.push(n)}}
    get firstChild(){return this.children[0]||null}get lastChild(){return this.children.at(-1)||null}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null}
    set textContent(t){this.children=[];this._text=String(t)}get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
    set innerHTML(html){this.children=[];this._text='';parseHTML(this,html)}get innerHTML(){return this._html||''}
    setAttribute(key,value){this.attributes[key]=String(value);if(key==='class')this.className=value;if(key==='id')this.id=value;if(key==='type')this.type=value;if(key==='value')this.value=value;if(key==='min'||key==='max'||key==='name')this[key]=value;if(key==='hidden')this.hidden=true;if(key==='disabled')this.disabled=true;if(key==='checked')this.checked=true;if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value}
    getAttribute(key){return this.attributes[key]}
    addEventListener(name,fn){(this.listeners[name]||=[]).push(fn)}removeEventListener(name,fn){this.listeners[name]=(this.listeners[name]||[]).filter(x=>x!==fn)}
    dispatch(name,event={}){for(const fn of this.listeners[name]||[])fn({...event,target:event.target||this});this['on'+name]?.({...event,target:event.target||this})}
    focus(){document.activeElement=this}select(){}setPointerCapture(){}
    click(){if(this.disabled)return;if(this.tagName==='A')downloads.push({name:this.download,url:this.href});this.dispatch('click')}
    animate(){return {pause(){},play(){},cancel(){}}}
    querySelectorAll(selector){const matches=[],selectors=selector.split(',').map(x=>x.trim());function walk(el){for(const child of el.children){if(selectors.some(s=>match(child,s)))matches.push(child);walk(child)}}walk(this);return matches}
    querySelector(s){return this.querySelectorAll(s)[0]||null}
  }
  function match(el,s){if(s==='input:checked')return el.tagName==='INPUT'&&el.checked;if(s.startsWith('.'))return (el.className||'').split(' ').includes(s.slice(1));if(s.startsWith('#'))return el.id===s.slice(1);if(s.startsWith('[')){const m=s.match(/^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);if(!m)return false;const value=m[1].startsWith('data-')?el.dataset[m[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:el.attributes[m[1]];return value!==undefined&&(m[2]===undefined||value===m[2])}return el.tagName===s.toUpperCase()}
  function parseHTML(root,html){root._html=html;const stack=[root];const tokens=String(html).match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)||[];for(const token of tokens){if(token.startsWith('<!'))continue;if(token.startsWith('</')){if(stack.length>1)stack.pop();continue}if(token.startsWith('<')){const m=token.match(/^<([\w-]+)/);if(!m)continue;const el=new Element(m[1]);for(const a of token.slice(m[0].length).matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))el.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).append(el);if(!['input','img','meta','link','br','hr','source','path','circle','rect','ellipse'].includes(m[1])&&!token.endsWith('/>'))stack.push(el)}else stack.at(-1)._text+=decode(token)}
    for(const textarea of root.querySelectorAll('textarea'))textarea.value=textarea.textContent;
    for(const select of root.querySelectorAll('select'))select.value=(select.children.find(o=>o.attributes.selected!==undefined)||select.children[0])?.attributes.value||'';
    for(const input of root.querySelectorAll('input')){if(input.min===undefined)input.min='';if(input.max===undefined)input.max=''}
  }
  const document={createElement:tag=>new Element(tag),createTextNode:text=>{const n=new Element('#text');n.textContent=text;return n},body:new Element('body'),activeElement:null,addEventListener(){},getElementById:id=>document.body.querySelector('#'+id)};
  const env={CompressionStream,DecompressionStream,TextEncoder,TextDecoder,atob,btoa,Response:class{constructor(stream){this.stream=stream}async arrayBuffer(){const reader=this.stream.getReader(),parts=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);length+=value.length}const all=new Uint8Array(length);let offset=0;for(const part of parts){all.set(part,offset);offset+=part.length}return all.buffer}async text(){return new TextDecoder().decode(await this.arrayBuffer())}},document,window:{},matchMedia:()=>({matches:false}),ResizeObserver:class{constructor(fn){this.fn=fn}observe(){this.fn()}disconnect(){}},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId},cancelAnimationFrame:id=>frames.delete(id),setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),setInterval:fn=>{timers.set(++timerId,fn);return timerId},clearInterval:id=>timers.delete(id),Blob,URL:{createObjectURL:blob=>{downloads.push({blob});return 'blob:test'},revokeObjectURL(){}},navigator:{clipboard:{writeText:async text=>clipboard.push(text)}},indexedDB:{open(){throw Error('Unavailable in logic tests')}},Audio:class{play(){return Promise.resolve()}pause(){}},console};env.window=env;
  return {env,document,downloads,clipboard,timers,frames,parseHTML,advanceFrames(){let now=0;for(let i=0;i<50&&frames.size;i++){now+=100;const current=[...frames.values()];frames.clear();current.forEach(fn=>fn(now))}}};
}
