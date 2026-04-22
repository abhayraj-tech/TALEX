"use strict";var ReplitPill=(()=>{(function(){if(typeof window>"u"||typeof document>"u")return;let d=window.self!==window.top;if(d&&document.referrer.startsWith("https://replit-com.web-sandbox.oaiusercontent.com"))return;let m=(()=>{let l=window.location.origin;return!!(l.endsWith(".replit.dev")||l.endsWith(".repl.co"))})(),s=!0,h=document.currentScript?.getAttribute("data-referral-code"),C=()=>{try{let l=!1;try{l=window.localStorage?.getItem("replit-pill-preference")==="hidden"}catch{}if(l||document.getElementById("replit-pill-host"))return;let c=document.createElement("div");c.id="replit-pill-host";let b=c.attachShadow({mode:"closed"}),y=`
        <path d="M25 19.995C25 20.0375 25 20.0575 25 20.085C25.015 21.34 25.5475 22.6275 26.425 23.525C26.445 23.545 26.4475 23.5475 26.45 23.55C26.485 23.585 26.5025 23.6025 26.54 23.6375C27.4225 24.485 28.6775 25.005 29.9025 25.03C29.9525 25.03 29.9975 25.03 30.0825 25.03H42C44.8 25.03 46.2 25.03 47.27 25.575C48.21 26.055 48.975 26.82 49.455 27.76C50 28.83 50 30.23 50 33.03V42.03C50 44.83 50 46.23 49.455 47.3C48.975 48.24 48.21 49.005 47.27 49.485C46.2 50.03 44.8 50.03 42 50.03H29.9275C28.6425 50.0325 27.3225 50.58 26.4125 51.485C26.4075 51.49 26.4775 51.42 26.45 51.4475C26.445 51.4525 26.4425 51.4525 26.4225 51.475C25.545 52.3725 25.0125 53.6575 24.9975 54.9125C24.9975 54.94 24.9975 54.9625 24.9975 55.0025V67.0575C24.9975 69.8575 24.9975 71.2575 24.4525 72.3275C23.9725 73.2675 23.2075 74.0325 22.2675 74.5125C21.1975 75.0575 19.7975 75.0575 16.9975 75.0575H7.9975C5.1975 75.0575 3.7975 75.0575 2.7275 74.5125C1.7875 74.0325 1.0225 73.2675 0.542498 72.3275C-0.00250244 71.2575 -0.00250244 69.8575 -0.00250244 67.0575V58.0575C-0.00250244 55.2575 -0.00250244 53.8575 0.542498 52.7875C1.0225 51.8475 1.7875 51.0825 2.7275 50.6025C3.7975 50.0575 5.1975 50.0575 7.9975 50.0575H19.7225C19.9 50.0575 19.9875 50.0575 20.08 50.055C21.2475 50.0125 22.4375 49.52 23.295 48.7225C23.3625 48.66 23.4125 48.61 23.5125 48.51C23.55 48.4725 23.5675 48.455 23.6025 48.42C24.455 47.5325 24.9725 46.2825 24.9975 45.0525C24.9975 45.0025 24.9975 44.96 24.9975 44.875V30.12C24.9975 30.0325 24.9975 29.99 24.9975 29.94C24.9725 28.71 24.455 27.46 23.6025 26.575C23.5675 26.54 23.55 26.52 23.5125 26.4825C23.475 26.445 23.4575 26.4275 23.42 26.3925C22.5325 25.54 21.2825 25.0225 20.0525 24.9975C20.0025 24.9975 19.96 24.9975 19.875 24.9975H7.9975C5.1975 24.9975 3.7975 24.9975 2.7275 24.4525C1.7875 23.9725 1.0225 23.2075 0.542498 22.2675C-0.00250244 21.1975 -0.00250244 19.7975 -0.00250244 16.9975V7.9975C-2.44146e-06 5.2 -2.44379e-06 3.8 0.544998 2.73C1.025 1.79 1.79 1.025 2.73 0.545C3.8 0 5.2 0 8 0H17C19.8 0 21.2 0 22.27 0.545C23.21 1.025 23.975 1.79 24.455 2.73C25 3.8 25 5.2 25 8V19.995Z" fill="currentColor"/>
      `,E=`
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      `,w=document.createElement("style");w.textContent=`
        #replit-pill {
          position: fixed;
          bottom: 48px;
          right: 48px;
          border-radius: 120px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          z-index: 1000000;
          white-space: nowrap;
          cursor: pointer;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: #f0f2f6;
          box-shadow: 1px 1px 1px 0px rgba(0, 0, 0, 0.05), 1px 1px 1px 0px rgba(255, 255, 255, 0.1);
          transition: transform 0.2s ease;
        }
        #replit-pill:hover {
          transform: scale(1.05);
        }
        #replit-pill .shimmer {
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          transition: transform 0.7s ease-in-out;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
          pointer-events: none;
        }
        #replit-pill:hover .shimmer {
          transform: translateX(100%);
        }
        #replit-pill .badge-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          position: relative;
          flex: 0 0 auto;
        }
        #replit-pill .replit-logo {
          color: #f0f2f6;
        }
        #replit-pill .replit-text {
          font-weight: 500;
          line-height: 20px;
          color: #f0f2f6;
        }
        #replit-pill .close-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          flex: 0 0 auto;
          border-radius: 64px;
          width: 12px;
          height: 12px;
          min-width: 0;
          cursor: pointer;
          border: none;
          box-sizing: border-box;
          background-color: transparent;
          transition: background-color 0.2s ease;
        }
        #replit-pill .close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        #replit-pill .close-button:focus-visible {
          outline: 1px solid #e6e9ef;
          outline-offset: 1px;
        }
        #replit-pill .close-icon {
          width: 8px;
          height: 8px;
          color: #e6e9ef;
        }
      `;let x=(t,o,i,f,p)=>{let e=document.createElementNS("http://www.w3.org/2000/svg","svg");return e.setAttribute("width",t),e.setAttribute("height",o),e.setAttribute("viewBox",i),e.setAttribute("fill","none"),p&&(e.className.baseVal=p),e.innerHTML=f,e},n=document.createElement("div");n.id="replit-pill";let v=document.createElement("div");v.className="shimmer";let u=document.createElement("div");u.className="badge-content";let M=x("10.67","16","0 0 50 75",y,"replit-logo"),g=document.createElement("div");g.textContent="Made with Replit",g.className="replit-text";let r=document.createElement("button");r.className="close-button",r.setAttribute("aria-label","Close");let a=x("24","24","0 0 24 24",E,"close-icon");a.setAttribute("stroke","currentColor"),a.setAttribute("stroke-width","2"),a.setAttribute("stroke-linecap","round"),a.setAttribute("stroke-linejoin","round"),r.appendChild(a),u.append(M,g),n.append(v,u,r),n.onclick=t=>{if(t.target!==r&&t.target!==r.firstChild){let o=h?`https://replit.com/referral-code/${h}?source=badge&referrer=${encodeURIComponent(window.location.origin)}`:"https://join.replit.com/badge_v3";if(d&&m&&window.parent){let i={type:"CLICKED_MADE_WITH_REPLIT_BADGE"};window.parent.postMessage(i,"*")}else window.open(o,"_blank")}},r.onclick=t=>{t.stopPropagation(),n.style.display="none";try{window.localStorage.setItem("replit-pill-preference","hidden")}catch{}},b.appendChild(w),b.appendChild(n),document.body.appendChild(c),d&&m?window.addEventListener("message",t=>{let o=t.origin,i=new URL(o),f=i.hostname==="replit.com"||i.hostname.endsWith(".replit.com")||i.hostname.endsWith(".replit.dev")||i.hostname.endsWith(".repl.co"),p=!1;if(document.referrer)try{let S=new URL(document.referrer).origin;p=o===S}catch{}if(!f&&!p)return;let e=t.data;if(!(!e||typeof e!="object"||!e.type)){if(e.type==="SHOW_MADE_WITH_REPLIT_BADGE"){if(s)return;n.style.display="inline-flex",s=!0}else if(e.type==="HIDE_MADE_WITH_REPLIT_BADGE"){if(!s)return;n.style.display="none",s=!1}}}):s=!0}catch{}};document.readyState==="complete"||document.readyState==="interactive"?setTimeout(C,100):document.addEventListener("DOMContentLoaded",C)})();})();
