let t=null;function c(){return t||(t=document.createElement("div"),t.className="toast-container",t.id="toast-container",document.body.appendChild(t)),t}function r(s,e="info",o=3e3){const a=c(),i={success:"✓",error:"✕",warning:"⚠",info:"ℹ"},n=document.createElement("div");n.className=`toast toast-${e}`,n.innerHTML=`
    <span style="font-size:1.1em;font-weight:700;">${i[e]||"ℹ"}</span>
    <span>${s}</span>
  `,a.appendChild(n),setTimeout(()=>{n.classList.add("leaving"),setTimeout(()=>n.remove(),300)},o)}export{r as t};
