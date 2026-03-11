import{c as h}from"./index-CJupM59u.js";import{e as u}from"./escape-lW1fV86Q.js";import{c as v,q as f,b as w}from"./expandable-transition-Waz0H6DS.js";const _="family_study_photos",E=1,d="photos";function L(){return new Promise((e,n)=>{const t=indexedDB.open(_,E);t.onupgradeneeded=()=>{const s=t.result;s.objectStoreNames.contains(d)||s.createObjectStore(d,{keyPath:"id"})},t.onsuccess=()=>e(t.result),t.onerror=()=>n(t.error)})}async function X(e){if(e&&e.startsWith("f_"))try{const t=`/api/photos/${encodeURIComponent(e)}`,s=h.token?{Authorization:`Bearer ${h.token}`}:{},o=await fetch(t,{headers:s,cache:"no-store"});if(o.ok){const a=await o.blob(),r=URL.createObjectURL(a);return setTimeout(()=>URL.revokeObjectURL(r),300*1e3),r}}catch(t){console.error("R2 获取失败:",t)}const n=await L();return new Promise((t,s)=>{const a=n.transaction(d,"readonly").objectStore(d).get(e);a.onsuccess=()=>t(a.result?.dataUrl||null),a.onerror=()=>s(a.error)})}function g(e,n=1200,t=.7){return new Promise(s=>{const o=new FileReader;o.onload=a=>{const r=new Image;r.onload=()=>{const c=document.createElement("canvas");let{width:i,height:l}=r;i>n&&(l=l*n/i,i=n),c.width=i,c.height=l,c.getContext("2d").drawImage(r,0,0,i,l),c.toBlob(y=>{const S=new File([y],e.name||"photo.jpg",{type:"image/jpeg",lastModified:Date.now()});s(S)},"image/jpeg",t)},r.src=a.target.result},o.readAsDataURL(e)})}function F(e=4){return new Promise((n,t)=>{const s=document.createElement("input");s.type="file",s.accept="image/*",s.multiple=!0,s.style.display="none",document.body.appendChild(s),s.onchange=async o=>{try{let a=Array.from(o.target.files);if(a.length===0){t(new Error("未选择图片"));return}a.length>e&&(a=a.slice(0,e));const r=[];for(const c of a){const i=await g(c),l=URL.createObjectURL(i);r.push({file:i,previewUrl:l})}n(r)}catch(a){t(a)}finally{document.body.removeChild(s)}},s.oncancel=()=>{document.body.removeChild(s),t(new Error("取消选择"))},s.click()})}function V(){return new Promise((e,n)=>{const t=document.createElement("input");t.type="file",t.accept="image/*",t.capture="environment",t.style.display="none",document.body.appendChild(t),t.onchange=async s=>{const o=s.target.files[0];if(!o){n(new Error("未选择图片"));return}try{const a=await g(o),r=URL.createObjectURL(a);e({file:a,previewUrl:r})}catch(a){n(a)}finally{document.body.removeChild(t)}},t.oncancel=()=>{document.body.removeChild(t),n(new Error("取消拍照"))},t.click()})}function T(e){if(!e)return[];try{const n=JSON.parse(e);return Array.isArray(n)?n:[e]}catch{return[e]}}function U(e){return T(e?.photoKey||e?.photo_key)}function A(e,n=Date.now()){const t=e?.photoAccessStatus||e?.photo_access_status;if(t){if(t==="available_today")return"available";if(t==="pending_review")return"pending";if(t==="expired")return"expired"}if(!U(e).length)return"none";if(e?.status==="pending")return"pending";const o=Number(e?.reviewPhotoExpiresAt||e?.review_photo_expires_at||e?.photoAvailableUntil||e?.photo_available_until||0),a=Number(e?.photoClearedAt||e?.photo_cleared_at||0),r=Number(e?.reviewedAt||e?.reviewed_at||0);return!a&&o?n<o?"available":"expired":!a&&r&&N(r,n)?"available":"expired"}function z(e,n=Date.now()){return A(e,n)==="available"}function N(e,n){const t=s=>{const a=new Date(s+288e5);return Date.UTC(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate())-288e5};return t(e)===t(n)}const G=1e3,C=3,P=88,R=28,I=72;function $(e,n){const t=Number(e);return Number.isFinite(t)?t:n}function b(e){return Math.max(2,Math.min(6,$(e,C)))}function p(e){return e==null?"":String(e).replace(/\r\n?/g,`
`).trim()}function K(e){return p(e).length>0}function M(e){const n=p(e);if(!n)return{text:n,charCount:0,lineCount:0,longestLineLength:0};const t=n.split(`
`);return{text:n,charCount:n.length,lineCount:t.length,longestLineLength:t.reduce((s,o)=>Math.max(s,o.length),0)}}function B(e,n={}){const t=b(n.previewLines),s=M(e);return s.charCount?s.lineCount>t||s.charCount>P||s.longestLineLength>R:!1}function D(e,n=I){const t=p(e);if(!t)return"";const s=t.split(`
`).map(o=>o.trim()).filter(Boolean).join(" / ").replace(/\s{2,}/g," ").trim();return s.length<=n?s:`${s.slice(0,n).trimEnd()}...`}function W(e,n={}){const t=p(e);if(!t)return"";const s=b(n.previewLines),o=B(t,{previewLines:s}),a=D(t),r=n.label||"文字提交",c=n.collapsedLabel||"展开",i=n.expandedLabel||"收起";return`
    <section
      class="submission-text-card${n.className?` ${n.className}`:""} ${o?"is-collapsible":"is-inline"}"
      data-submission-text-block
      ${o?`data-preview-lines="${s}" data-expanded="false"`:""}
    >
      ${o?`
        <button
          class="submission-text-trigger submission-text-toggle"
          data-submission-text-toggle
          data-collapsed-label="${u(c)}"
          data-expanded-label="${u(i)}"
          aria-expanded="false"
          type="button"
        >
          <span class="submission-text-trigger-main">
            <span class="submission-text-label">${u(r)}</span>
            <span class="submission-text-preview" data-submission-text-preview>${u(a)}</span>
          </span>
          <span class="submission-text-affordance">
            <span data-submission-text-toggle-label>${u(c)}</span>
            <span class="submission-text-toggle-chevron" aria-hidden="true"></span>
          </span>
        </button>
      `:`
        <div class="submission-text-trigger submission-text-trigger-static">
          <span class="submission-text-label">${u(r)}</span>
        </div>
      `}
      <div class="submission-text-shell" data-submission-text-shell>
        <div class="submission-text-content" data-submission-text-content>
          <div class="submission-text-body" data-submission-text-body>${u(t)}</div>
        </div>
      </div>
    </section>
  `}function Y(e=document){(e?.matches?.("[data-submission-text-block]")?[e,...e.querySelectorAll("[data-submission-text-block]")]:Array.from(e?.querySelectorAll?.("[data-submission-text-block]")||[])).forEach(t=>{const s=t.querySelector("[data-submission-text-shell]"),o=t.querySelector("[data-submission-text-content]"),a=t.querySelector("[data-submission-text-toggle]");if(!s||!o)return;if(!a){s.style.height="auto";return}if(!x(o))return;const c=t.dataset.expanded==="true";m(a,c),s.style.height=c?"auto":"0px",a.dataset.bound!=="true"&&(a.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation(),q(t)}),a.dataset.bound="true")})}function q(e){const n=e.querySelector("[data-submission-text-shell]"),t=e.querySelector("[data-submission-text-content]"),s=e.querySelector("[data-submission-text-toggle]");if(!n||!t||!s)return;const o=x(t);if(o){if(v(n),e.dataset.expanded==="true"){n.style.height=`${n.offsetHeight||o.expandedHeight}px`,f(n,()=>{e.dataset.expanded="false",m(s,!1),n.style.height="0px"});return}e.dataset.expanded="true",m(s,!0),n.style.height=`${n.offsetHeight||0}px`,f(n,()=>{n.style.height=`${o.expandedHeight}px`}),w(n,()=>{e.dataset.expanded==="true"&&(n.style.height="auto")})}}function m(e,n){e.setAttribute("aria-expanded",n?"true":"false");const t=e.querySelector("[data-submission-text-toggle-label]");t&&(t.textContent=n?e.dataset.expandedLabel||"收起":e.dataset.collapsedLabel||"展开")}function x(e){const n=e.scrollHeight;return n?{expandedHeight:n}:null}export{G as S,A as a,V as b,z as c,F as d,X as e,U as g,K as h,p as n,T as p,W as r,Y as s};
