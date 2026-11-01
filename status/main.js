(()=>{var _="openchamber.sdk",E=1;var We=`
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [data-oc-scrolling] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [data-oc-scrolling] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [data-oc-scrolling]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [data-oc-scrolling] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;function Ke(e){let r=e.documentElement;if(r.hasAttribute("data-oc-scrollbar-activity"))return;r.setAttribute("data-oc-scrollbar-activity","");let n=new WeakMap;e.addEventListener("scroll",(u)=>{let c=u.target===e?r:u.target;if(!(c instanceof Element))return;if(!c.hasAttribute("data-oc-scrolling"))c.setAttribute("data-oc-scrolling","");let f=n.get(c);if(f!==void 0)clearTimeout(f);n.set(c,setTimeout(()=>{n.delete(c),c.removeAttribute("data-oc-scrolling")},1000))},{capture:!0,passive:!0})}var Qo=`(${Ke.toString()})(document);`;var Je=128,Ye=65536;var ge=128;var Oe=65536;var qt=/^[a-z][a-z0-9-]{0,39}$/;var Yt=(e)=>Object(e)===e&&!Array.isArray(e),Qe=(e,r)=>Object.keys(e).every((n)=>r.includes(n)),Qt=(e)=>String(e)===e&&e.length>=1&&e.length<=60,Zt=(e)=>String(e)===e&&e.length>=1&&e.length<=80,eo=(e)=>{if(!Array.isArray(e)||e.length>4)return!1;let r=new Set;for(let n of e){if(!Yt(n)||!qt.test(n.id)||!Qt(n.label))return!1;if(n.disabled!==void 0&&n.disabled!==!0&&n.disabled!==!1)return!1;if(r.has(n.id))return!1;if(r.add(n.id),n.kind==="button"){if(!Qe(n,["kind","id","label","disabled"]))return!1;continue}if(n.kind!=="select"||!Qe(n,["kind","id","label","value","options","disabled"]))return!1;if(!Zt(n.value)||!Array.isArray(n.options)||n.options.length<1||n.options.length>16)return!1;let u=new Set;for(let c of n.options){if(!Yt(c)||!Qe(c,["value","label"])||!Zt(c.value)||!Qt(c.label)||u.has(c.value))return!1;u.add(c.value)}if(!u.has(n.value))return!1}return!0};var be=20000000,Ae=256;var Ze=(e)=>("bytes"in e)?e.bytes.byteLength:e.content.length,to=(e,r)=>{if(e.path!==r.path||e.readOnly!==r.readOnly)return!1;if(e.encoding==="text"||r.encoding==="text")return e.encoding==="text"&&r.encoding==="text"&&e.content===r.content;if(e.bytes.byteLength!==r.bytes.byteLength)return!1;for(let n=0;n<e.bytes.byteLength;n+=1)if(e.bytes[n]!==r.bytes[n])return!1;return!0};var oo=/^[A-Za-z0-9_-]{1,80}$/;var ro=["left","right","top","bottom"];var no=(e,r=0,n={remaining:16000})=>{if(--n.remaining<0||r>=32)return!1;if(e===null)return!0;let u=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let c of u)if(!no(c,r+1,n))return!1;return!0},qe=(e)=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every((r)=>/^(0|[1-9]\d*)$/.test(r)&&Number(r)<e.length)&&e.every(qe);if(Object(e)===e){let r=Object.getPrototypeOf(e);return(r===null||r===Object.prototype)&&Object.values(e).every(qe)}return String(e)===e||Number.isFinite(e)},et=(e)=>{try{if(String(e.id)!==e.id||!oo.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!ro.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!no(e.data)||!qe(e.data))return!1;return JSON.stringify(e.data).length<=16000}catch{return!1}};var io=["file","directory","other","missing"],ot=(e)=>Boolean(e&&"sessionId"in e),rt=(e)=>Boolean(e&&"sent"in e&&!("sessionId"in e));var ao=/^[0-9a-f]{7,64}$/i,nt=(e)=>ao.test(e),Re=500,ke=32000,co=16000,lo=128,po=200,uo=2000,_o=16000,Eo=80,fo=200,So=16000;var To=2000;var st=20000,ye=1024,Ue=2000000;var ve=64000,we=8000,it=4000;var at=960000;var mo=999,ho=1e4,pe=500,xo=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],go=["stopped","starting","ready","failed"],qo=new Set(xo),Oo=(e)=>qo.has(e),bo=(e)=>e&&Oo(e)?e:"HOST_REJECTED",Z=(e)=>{if(e===void 0)return!1;if(e===null||e===!0||e===!1)return!0;if(String(e)===e)return!0;if(Number(e)===e)return Number.isFinite(e);if(Array.isArray(e))return e.every(Z);if(Object(e)===e)return Object.values(e).every(Z);return!1},Ao=(e)=>Z(e)&&JSON.stringify(e).length<=So,so=(e)=>e?.trim().slice(0,fo)??"",q=(e)=>{let r=e.id.trim().slice(0,lo),n=e.title.trim().slice(0,po),u=e.url.trim().slice(0,uo),c=e.text?.trim().slice(0,_o),f=e.author?.trim().slice(0,Eo),O=e.kind==="pull"?"pull":"issue",k={providerId:e.providerId.trim(),id:r,title:n||r,url:u,kind:O};if(c)k.text=c;if(f)k.author=f;if(O==="pull"){let G=so(e.branches?.head),P=so(e.branches?.base);if(G&&P)k.branches={head:G,base:P}}if(Ao(e.data))k.data=e.data;return k},ct=(e)=>{let r=q(e);if(e.projectId)r.projectId=e.projectId;if(e.navigation)r.navigation=e.navigation;if(e.worktree)r.worktree=e.worktree;return r},dt=(e)=>{let r={text:e.text.trim().slice(0,co)};if(e.send)r.send=!0;return r},lt=(e)=>{if(e===null||!Number.isFinite(e))return null;return Math.min(mo,Math.max(0,Math.round(e)))},pt=(e)=>{if(!Number.isFinite(e))return 0;return Math.min(ho,Math.max(0,Math.ceil(e)))};var ee=(e)=>e.length>0&&e.length<=ye&&!e.includes("\x00")&&!e.includes("\\");var Ce=(e)=>{if(!e.startsWith("/")||e.includes("\x00")||e.includes("\\")||e.includes("://"))return!1;if(e.length>To)return!1;return!e.split("/").some((n)=>n==="."||n==="..")},er=new Set(go),ut=(e)=>Boolean(e&&"status"in e&&er.has(String(e.status))&&!("body"in e)),Ie=(e)=>Boolean(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),_t=(e)=>Boolean(e&&"content"in e&&String(e.content)===e.content),Et=(e)=>Boolean(e&&"written"in e&&e.written===!0),ft=(e)=>Boolean(e&&"entries"in e&&Array.isArray(e.entries)),tr=new Set(io),St=(e)=>Boolean(e&&"kind"in e&&"size"in e&&tr.has(String(e.kind))&&Number.isFinite(e.size)),Tt=(e)=>Boolean(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),or=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late"]),rr=(e)=>Object(e)===e?e:null,tt=(e)=>String(e)===e&&e.length>0,nr=(e)=>{if(!tt(e.id))return null;if(e.ok===!0){let r={channel:_,v:E,type:"result",id:e.id,ok:!0};if(Object(e.payload)===e.payload)r.payload=e.payload;return r}if(e.ok===!1&&tt(e.error))return{channel:_,v:E,type:"result",id:e.id,ok:!1,error:e.error,code:bo(tt(e.code)?e.code:void 0)};return null},mt=(e)=>{let r=rr(e);if(!r||r.channel!==_||r.v!==E)return null;if(r.type==="result")return nr(r);if(!or.has(String(r.type))||Object(r.payload)!==r.payload)return null;return r};var Ro=(e)=>("key"in e)&&("metaKey"in e)&&("ctrlKey"in e),sr=(e)=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s";class a extends Error{code;constructor(e,r){super(r);this.name="HostRequestError",this.code=e}}var ko=()=>Promise.reject(new a("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),Le=()=>Promise.reject(new a("BAD_PATH",`File path must be 1 to ${ye} characters without NUL or backslash.`)),Me=(e)=>{if(e===void 0)return;if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new a("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0},p=(e)=>(e.value+=1,`oc-${e.value}`),ht=(e={})=>{let r=e.target??("window"in globalThis?window:null);if(!r)throw new a("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let n=e.acceptSource??((t)=>t===r.parent),u=e.requestTimeoutMs??st,c=new Set,f=new Set,O=new Set,k=new Set,G=new Set,P=new Set,ne=new Set,Ee=new Set,fe=new Set,K=new Set,Fe=[],se=null,ie=null,Se=new Set,Te=new Set,ae=null,ce=null,Be=!1,J=new Map,Y=new Map,Q=new Map,D=!1,l={value:0},d=null,H=null,de=!1,le=!1,Dt=null,Ht=(t)=>{if(!t)return null;return{sessionId:t.id,phase:t.busy?"started":"completed"}},I=(t)=>{r.parent.postMessage(t,"*")},$t=()=>{if(D||r.parent===r||K.size===0||d?.features?.lateGenerateResults!==!0)return;I({channel:_,v:E,type:"generate-late-listen"})},x=(t,o)=>{for(let s of t)try{s(o)}catch(i){console.error(i)}},Xt=(t)=>{if(!(t instanceof MessageEvent))return;if(!n(t.source))return;let o=mt(t.data);if(!o)return;if(o.type==="workspace"){let i=Y.get(o.payload.subscriptionId);if(i)x([i],o.payload.snapshot);return}if(o.type==="shells"){let i=Q.get(o.payload.subscriptionId);if(i)x([i],o.payload.snapshot);return}if(o.type==="ready"){if(d=o.payload,H=Ht(o.payload.session),x(c,o.payload),x(f,o.payload.directory),x(O,o.payload.session),H)x(k,H);x(G,o.payload.connection),x(P,o.payload.settings),x(ne,o.payload.item),$t();return}if(o.type==="generate-late"){if(K.size===0)Fe.push(o.payload);else x(K,o.payload);return}if(o.type==="directory"){if(d)d={...d,directory:o.payload.directory};x(f,o.payload.directory);return}if(o.type==="session"){if(d)d={...d,session:o.payload.session};if(!o.payload.session)H=null;else if(H?.sessionId!==o.payload.session.id)H=Ht(o.payload.session);x(O,o.payload.session);return}if(o.type==="session-lifecycle"){H=o.payload,x(k,o.payload);return}if(o.type==="connection"){if(d)d={...d,connection:o.payload.connection};x(G,o.payload.connection);return}if(o.type==="settings"){if(d)d={...d,settings:o.payload.settings};x(P,o.payload.settings);return}if(o.type==="item"){if(d)d={...d,item:o.payload.item};x(ne,o.payload.item);return}if(o.type==="status-control-event"){x(Ee,o.payload);return}if(o.type==="popover-closed"){x(fe,o.payload);return}if(o.type==="action"){let i=(S)=>{if(!D)I({channel:_,v:E,type:"action-result",id:o.id,payload:S})},T=ie;if(!T){i({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>T(o.payload)).then(()=>i({ok:!0}),(S)=>{let R=(S instanceof Error?S.message:String(S)).trim();i({ok:!1,error:(R||"Action failed.").slice(0,pe)})});return}if(o.type==="file-open"){let i=o.payload;if(ce&&to(ce,i))return;ce=i,x(Se,o.payload);return}if(o.type==="file-saved"){x(Te,o.payload.version);return}if(o.type==="file-snapshot"){let i=(R)=>{if(!D)I({channel:_,v:E,type:"file-snapshot-result",id:o.id,payload:R})},T=(R)=>i({error:(R.trim()||"Could not read the edited file.").slice(0,pe)}),S=ae;if(!S){T("This extension does not edit files.");return}Promise.resolve().then(()=>S(o.payload.purpose)).then((R)=>{if(Ze(R)>be){T(`The file is over ${be} ${"bytes"in R?"bytes":"characters"}.`);return}if(R.version.length>Ae){T(`The snapshot version is over ${Ae} characters.`);return}i({snapshot:"bytes"in R?{bytes:R.bytes,version:R.version}:{content:R.content,version:R.version}})},(R)=>T(R instanceof Error?R.message:String(R)));return}if(o.type==="resolve"){let i=(S)=>{I({channel:_,v:E,type:"resolve-result",id:o.id,payload:S})},T=se;if(!T){i({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>T(o.payload)).then((S)=>i({item:S?q(S):null}),(S)=>{let R=(S instanceof Error?S.message:String(S)).trim();i({error:(R||"Command failed.").slice(0,pe)})});return}let s=J.get(o.id);if(!s)return;if(clearTimeout(s.timer),J.delete(o.id),o.ok){s.resolve(o.payload);return}s.reject(new a(o.code,o.error))};r.addEventListener("message",Xt),I({channel:_,v:E,type:"hello"});let w=(t,o=u)=>{if(D||r.parent===r)return Promise.reject(new a("HOST_UNAVAILABLE","No host frame. This page is not in an iframe."));return new Promise((s,i)=>{let T=setTimeout(()=>{J.delete(t.id),i(new a("HOST_TIMEOUT","Host did not answer in time."))},o);J.set(t.id,{resolve:s,reject:i,timer:T}),I(t)})},b=(t)=>w(t).then(()=>{return}),A={channel:_,v:E},Ve=(t)=>{if(!D&&r.parent!==r)I(t)},Ft=()=>Ve({...A,type:"file-save"}),Bt=(t)=>{if(!Ro(t)||!sr(t))return;t.preventDefault(),Ft()},Vt=(t)=>{if(!Ro(t)||t.key!=="Escape"||d?.surface!=="popover"||!d.popover)return;t.preventDefault(),Kt(d.popover.id,"escape").catch(()=>{return})},me=()=>{let t=d?.surface==="popover"?d.popover:void 0;if(!t)return;let o=de||le;if(Dt===o)return;Dt=o,Jt(t.id,o).catch(()=>{return})},he=()=>{if(d?.surface!=="popover"||de)return;de=!0,me()},jt=(t)=>{if(d?.surface!=="popover"||t.relatedTarget!==null||!de)return;de=!1,me()},zt=()=>{if(d?.surface!=="popover"||le)return;le=!0,me()},Wt=()=>{if(d?.surface!=="popover"||!le)return;le=!1,me()},M=(t,o=1024)=>{if(!t.trim()||t.length>o)throw new a("HOST_REJECTED",`Identity must contain 1 to ${o} characters.`)},je=async(t)=>{if(t.kind!=="projects")M(t.projectId);let o=await w({...A,type:"workspace-read",id:p(l),payload:t});if(!o||!("kind"in o)||!("state"in o)||o.kind!==t.kind)throw new a("HOST_REJECTED","Host did not return workspace data.");return o},ze=async(t,o)=>{if(t.kind!=="projects")M(t.projectId);let s=p(l);Y.set(s,o);try{await b({...A,type:"workspace-subscribe",id:p(l),payload:{subscriptionId:s,query:t}})}catch(i){if(Y.delete(s),!D)I({...A,type:"workspace-unsubscribe",id:p(l),payload:{subscriptionId:s}});throw i}return()=>{if(!Y.delete(s)||D)return;I({...A,type:"workspace-unsubscribe",id:p(l),payload:{subscriptionId:s}})}},Yo=async(t,o)=>{if(t.kind==="session")M(t.sessionId);if(t.kind==="project")M(t.projectId);let s=p(l);Q.set(s,o);try{await b({...A,type:"shells-subscribe",id:p(l),payload:{subscriptionId:s,scope:t}})}catch(i){if(Q.delete(s),!D)I({...A,type:"shells-unsubscribe",id:p(l),payload:{subscriptionId:s}});throw i}return()=>{if(!Q.delete(s)||D)return;I({...A,type:"shells-unsubscribe",id:p(l),payload:{subscriptionId:s}})}},xe=async(t)=>{if("key"in t&&(t.key.length===0||t.key.length>Je))throw new a("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!Z(t.value))throw new a("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>Ye)throw new a("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&d?.features?.deviceStorage!==!0)throw new a("UNSUPPORTED","This host does not support device storage.");let o=await w({...A,type:"storage",id:p(l),payload:t});if(!o||!("storage"in o)||o.op!==t.op)throw new a("HOST_REJECTED","Host did not return storage data.");return o},Kt=(t,o)=>d?.features?.popovers!==!0&&!(d?.surface==="popover"&&d.popover?.id===t)?Promise.reject(new a("UNSUPPORTED","This host does not support popovers.")):b({...A,type:"popover-close",id:p(l),payload:o?{id:t,reason:o}:{id:t}}),Jt=(t,o)=>d?.features?.popovers!==!0&&!(d?.surface==="popover"&&d.popover?.id===t)?Promise.reject(new a("UNSUPPORTED","This host does not support popovers.")):b({...A,type:"popover-anchor",id:p(l),payload:{id:t,active:o}});return r.addEventListener("keydown",Vt,!0),r.addEventListener("pointerover",he),r.addEventListener("pointermove",he),r.addEventListener("pointerout",jt),r.addEventListener("focus",zt),r.addEventListener("blur",Wt),{onAction:(t)=>(ie=t,()=>{if(ie===t)ie=null}),listProjects:async()=>{let t=await je({kind:"projects"});if(t.kind!=="projects")throw new a("HOST_REJECTED","Expected projects.");return t},listWorktrees:async(t)=>{let o=await je({kind:"worktrees",projectId:t});if(o.kind!=="worktrees")throw new a("HOST_REJECTED","Expected worktrees.");return o},listSessions:async(t)=>{let o=await je({kind:"sessions",projectId:t});if(o.kind!=="sessions")throw new a("HOST_REJECTED","Expected sessions.");return o},onProjects:(t)=>ze({kind:"projects"},(o)=>{if(o.kind==="projects")t(o)}),onWorktrees:(t,o)=>ze({kind:"worktrees",projectId:t},(s)=>{if(s.kind==="worktrees")o(s)}),onSessions:(t,o)=>ze({kind:"sessions",projectId:t},(s)=>{if(s.kind==="sessions")o(s)}),onRunningShells:(t,o)=>Yo(t,o),readShellOutput:async(t,o)=>{M(t,ge);let s=o?.cursor;if(s!==void 0&&(!Number.isInteger(s)||s<0))throw new a("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let i=o?.tailBytes;if(i!==void 0&&(!Number.isInteger(i)||i<1||i>Oe))throw new a("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${Oe}.`);let S=await w({...A,type:"shell-output",id:p(l),payload:{shellId:t,cursor:s,tailBytes:i}});if(!S||typeof S.output!=="string"||!Number.isFinite(S.cursor))throw new a("HOST_REJECTED","Host did not return shell output.");return S},stopShell:async(t)=>{if(M(t,ge),(await w({...A,type:"shell-stop",id:p(l),payload:{shellId:t}}))?.stopped!==!0)throw new a("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async(t)=>{M(t),await b({...A,type:"open-session",id:p(l),payload:{sessionId:t}})},storage:{get:async(t,o)=>{let s=Me(o),i={op:"get",key:t};if(s)i.scope=s;let T=await xe(i);return T.op==="get"&&T.found?T.value:void 0},set:async(t,o,s)=>{let i=Me(s),T={op:"set",key:t,value:o};if(i)T.scope=i;await xe(T)},delete:async(t,o)=>{let s=Me(o),i={op:"delete",key:t};if(s)i.scope=s;await xe(i)},keys:async(t)=>{let o=Me(t),s={op:"keys"};if(o)s.scope=o;let i=await xe(s);if(i.op!=="keys")throw new a("HOST_REJECTED","Expected storage keys.");return i.keys}},onReady:(t)=>{if(c.add(t),d)t(d);return()=>{c.delete(t)}},onDirectory:(t)=>{if(f.add(t),d)t(d.directory);return()=>{f.delete(t)}},onSession:(t)=>{if(O.add(t),d)t(d.session);return()=>{O.delete(t)}},onSessionLifecycle:(t)=>{if(k.add(t),H)t(H);return()=>{k.delete(t)}},onConnection:(t)=>{if(G.add(t),d)t(d.connection);return()=>{G.delete(t)}},onSettings:(t)=>{if(P.add(t),d)t(d.settings);return()=>{P.delete(t)}},onItem:(t)=>{if(ne.add(t),d)t(d.item);return()=>{ne.delete(t)}},onStatusControl:(t)=>(Ee.add(t),()=>{Ee.delete(t)}),onPopoverClosed:(t)=>(fe.add(t),()=>{fe.delete(t)}),setStatusControls:(t)=>{if(d?.features?.statusControls!==!0)return Promise.reject(new a("UNSUPPORTED","This host does not support status controls."));if(!eo(t))return Promise.reject(new a("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options."));return b({...A,type:"status-controls",id:p(l),payload:{controls:t}})},openPopover:(t)=>{if(d?.features?.popovers!==!0)return Promise.reject(new a("UNSUPPORTED","This host does not support popovers."));if(!et(t))return Promise.reject(new a("HOST_REJECTED","Popover requests need bounded geometry and JSON data."));return b({...A,type:"popover-open",id:p(l),payload:t})},closePopover:Kt,setPopoverAnchorActive:Jt,onResolve:(t)=>(se=t,()=>{if(se===t)se=null}),toast:(t)=>{let o=t.message.trim();if(!o||o.length>Re)return Promise.reject(new a("HOST_REJECTED",`Toast message must contain 1 to ${Re} characters.`));if(t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>ke))return Promise.reject(new a("HOST_REJECTED",`Toast copy text must contain 1 to ${ke} characters.`));return b({channel:_,v:E,type:"toast",id:p(l),payload:{...t,message:o}})},openUrl:(t)=>b({channel:_,v:E,type:"open-url",id:p(l),payload:{url:t}}),openCommit:(t)=>nt(t)?b({channel:_,v:E,type:"open-commit",id:p(l),payload:{sha:t}}):Promise.reject(new a("HOST_REJECTED","Commit id must be 7 to 64 hex characters.")),openSurface:(t)=>b({channel:_,v:E,type:"open-surface",id:p(l),payload:{surfaceId:t}}),writeClipboard:(t)=>b({channel:_,v:E,type:"clipboard-write",id:p(l),payload:{text:t}}),compose:(t)=>b({channel:_,v:E,type:"compose",id:p(l),payload:t}),attach:(t)=>b({channel:_,v:E,type:"attach",id:p(l),payload:q(t)}),startSession:async(t)=>{if(t.projectId!==void 0)M(t.projectId);let o=t.worktree;if(o&&o!==!0)if(o.kind==="existing")M(o.directory);else{if(o.name!==void 0)M(o.name,200);if(o.baseBranch!==void 0)M(o.baseBranch,200)}let s=await w({channel:_,v:E,type:"start-session",id:p(l),payload:ct(t)},e.requestTimeoutMs??180000);if(!ot(s))throw new a("HOST_REJECTED","Host did not return a session.");return s},prompt:(t)=>w({channel:_,v:E,type:"prompt",id:p(l),payload:dt(t)}).then((o)=>{if(!rt(o))throw new a("HOST_REJECTED","Host did not return a prompt result.");return o}),sessionLink:(t)=>b({channel:_,v:E,type:"session-link",id:p(l),payload:q(t)}),close:()=>b({channel:_,v:E,type:"close",id:p(l)}),oauthStart:()=>b({channel:_,v:E,type:"oauth-start",id:p(l)}),oauthDisconnect:()=>b({channel:_,v:E,type:"oauth-disconnect",id:p(l)}),request:(t)=>(Ce(t.path)?w({channel:_,v:E,type:"request",id:p(l),payload:t}):ko()).then((o)=>{if(!Ie(o))throw new a("HOST_REJECTED","Host request result was empty.");return o}),serviceRequest:(t)=>(Ce(t.path)?w({channel:_,v:E,type:"service-request",id:p(l),payload:t}):ko()).then((o)=>{if(!Ie(o))throw new a("HOST_REJECTED","Host service request result was empty.");return o}),serviceStatus:()=>w({channel:_,v:E,type:"service-status",id:p(l)}).then((t)=>{if(!ut(t))throw new a("HOST_REJECTED","Host did not return service status.");return t}),readFile:(t)=>(ee(t)?w({channel:_,v:E,type:"file-read",id:p(l),payload:{path:t}}):Le()).then((o)=>{if(!_t(o))throw new a("HOST_REJECTED","Host did not return file content.");return o}),writeFile:(t,o)=>{if(!ee(t))return Le();if(o.length>Ue)return Promise.reject(new a("FILE_TOO_LARGE",`Content is over ${Ue} characters.`));return w({channel:_,v:E,type:"file-write",id:p(l),payload:{path:t,content:o}}).then((s)=>{if(!Et(s))throw new a("HOST_REJECTED","Host did not confirm the write.");return s})},listDir:(t)=>(ee(t)?w({channel:_,v:E,type:"file-list",id:p(l),payload:{path:t}}):Le()).then((o)=>{if(!ft(o))throw new a("HOST_REJECTED","Host did not return directory entries.");return o}),stat:(t)=>(ee(t)?w({channel:_,v:E,type:"file-stat",id:p(l),payload:{path:t}}):Le()).then((o)=>{if(!St(o))throw new a("HOST_REJECTED","Host did not return file status.");return o}),generate:(t)=>{let o=t.prompt.trim(),s=t.system?.trim();if(o.length===0||o.length>ve)return Promise.reject(new a("HOST_REJECTED",`Prompt must be 1 to ${ve} characters.`));if(s!==void 0&&(s.length===0||s.length>we))return Promise.reject(new a("HOST_REJECTED",`System prompt must be 1 to ${we} characters.`));let i=t.maxOutputTokens===void 0?void 0:Math.min(it,Math.max(1,Math.floor(t.maxOutputTokens)));if(i!==void 0&&!Number.isFinite(i))return Promise.reject(new a("HOST_REJECTED","maxOutputTokens must be a number."));let T={prompt:o};if(s!==void 0)T.system=s;if(i!==void 0)T.maxOutputTokens=i;return w({channel:_,v:E,type:"generate",id:p(l),payload:T},e.requestTimeoutMs??at).then((S)=>{if(!Tt(S))throw new a("HOST_REJECTED","Host did not return generated text.");return S})},onLateGenerateResult:(t)=>{K.add(t);for(let o of Fe.splice(0))x([t],o);return $t(),()=>{K.delete(t)}},setBadge:(t)=>b({channel:_,v:E,type:"badge",id:p(l),payload:{count:lt(t)}}),setHeight:(t)=>b({channel:_,v:E,type:"resize",id:p(l),payload:{height:pt(t)}}),onFileOpen:(t)=>{if(Se.add(t),!Be)Be=!0,r.addEventListener("keydown",Bt,!0);if(ce)t(ce);return()=>{Se.delete(t)}},onFileSnapshot:(t)=>(ae=t,()=>{if(ae===t)ae=null}),onFileSaved:(t)=>(Te.add(t),()=>{Te.delete(t)}),reportFileChange:(t)=>Ve({...A,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:Ft,reportFileUnsupported:()=>Ve({...A,type:"file-unsupported"}),dispose:()=>{for(let t of Y.keys())I({...A,type:"workspace-unsubscribe",id:p(l),payload:{subscriptionId:t}});Y.clear();for(let t of Q.keys())I({...A,type:"shells-unsubscribe",id:p(l),payload:{subscriptionId:t}});if(Q.clear(),D=!0,se=null,ie=null,ae=null,Se.clear(),Te.clear(),Be)r.removeEventListener("keydown",Bt,!0);r.removeEventListener("message",Xt),r.removeEventListener("keydown",Vt,!0),r.removeEventListener("pointerover",he),r.removeEventListener("pointermove",he),r.removeEventListener("pointerout",jt),r.removeEventListener("focus",zt),r.removeEventListener("blur",Wt);for(let t of J.values())clearTimeout(t.timer),t.reject(new a("HOST_UNAVAILABLE","Host client was disposed."));J.clear(),c.clear(),f.clear(),O.clear(),k.clear(),G.clear(),P.clear(),ne.clear(),Ee.clear(),fe.clear(),K.clear(),Fe.length=0}}};var yo=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var jr=new Set(yo);var Uo=["none","agent","user"];var Wr=new Set(Uo);var ir=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],ar=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],vo=(e,r)=>{r.style.colorScheme=e.mode;for(let[n,u]of ir)r.style.setProperty(n,e.tokens[u]);for(let[n,u,c]of ar){let f=e.tokens[c]??"";r.style.setProperty(n,f),r.style.setProperty(u,f)}r.style.setProperty("font-family",e.tokens.font),r.style.setProperty("font-size","0.875rem"),r.style.setProperty("line-height","1.45"),r.style.setProperty("color",e.tokens.foreground)},xt=(e,r)=>{if(vo(e.theme,r),r.dataset)r.dataset.ocSurface=e.surface,r.dataset.ocTheme=e.theme.mode};var cr={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},h=(e,r)=>`var(--${e}, var(--oc-${cr[e]}, ${r}))`,F=h("surface-background","transparent"),Ge=h("surface-elevated","transparent"),te=h("surface-elevated-foreground","inherit"),L=h("surface-foreground","inherit"),m=h("surface-muted-foreground","gray"),dr=h("surface-muted","transparent"),B=h("interactive-border","currentColor"),C=h("interactive-hover","transparent"),V=h("interactive-active","transparent"),gt=h("interactive-selection","transparent"),Ot=h("interactive-selection-foreground","inherit"),X=h("primary","currentColor"),bt=h("primary-text","inherit"),At=h("error-text","inherit"),lr=h("font-sans","inherit"),Rt=h("font-mono","monospace"),Mo=h("radius","9px"),kt=`calc(${Mo} - 2px)`,wo=`calc(${Mo} - 4px)`,g=(e,r,n="transparent")=>`color-mix(in srgb, ${e} ${r}%, ${n})`,Co=`background-image: linear-gradient(${C}, ${C});`,yt=(e)=>`box-shadow: inset 0 0 0 1px ${e}, var(--oc-sdk-field-lift);`,Ut="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",Io="box-shadow: var(--oc-sdk-lit);",Lo=`inset 0 1px 0 0 ${g(L,1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2)`,pr=`
:root {
  --oc-sdk-edge: ${g(L,10)};
  --oc-sdk-field-bg: ${Ge};
  --oc-sdk-raised-bg: ${F};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 2px 0 rgb(0 0 0 / 0.06);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.45), 0 1px 2px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.1);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.04), 0 1px 2px -0.5px rgb(0 0 0 / 0.08), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.08);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${g(L,6)};
  --oc-sdk-field-bg: ${g(F,50,Ge)};
  --oc-sdk-raised-bg: ${Ge};
  --oc-sdk-field-lift: ${Lo};
  --oc-sdk-raised-lift: ${Lo};
  --oc-sdk-lit: inset 0 1px 0 0 ${g(L,1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.36);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.06), inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 1px 1px -0.5px rgb(0 0 0 / 0.22), 0 3px 3px -1.5px rgb(0 0 0 / 0.2), 0 6px 6px -3px rgb(0 0 0 / 0.16);
}`,Ne=(e)=>{let r=h(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${r}; --oc-sdk-tone-text: ${h(`${e}-text`,"inherit")}; }`},ur=`
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: 6px; height: 28px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: 4px; height: 24px; padding: 0 8px; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: 8px 10px; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 28px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: 14px; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; }
`,No=`${pr}
.oc-sdk { color: ${L}; font-family: ${lr}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${Co} }
.oc-sdk-mono { font-family: ${Rt}; }
.oc-sdk-muted { color: ${m}; }
${Ne("success")}${Ne("warning")}${Ne("error")}${Ne("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${X}; --oc-sdk-tone-text: ${bt}; }

.oc-sdk-btn { border-radius: ${kt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${wo}; }
.oc-sdk-btn[data-variant="default"] { color: ${bt}; background: ${g(X,10,F)}; border-color: ${g(X,12)}; ${Io} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${g(X,16,F)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${g(X,22,F)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${dr}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${C}, ${C}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${V}, ${V}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${te}; ${Ut} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${C}, ${C}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${V}, ${V}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${C}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${V}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${h("status-error","red")}; color: ${At}; background: ${g("var(--oc-sdk-tone)",7,F)}; border-color: ${g("var(--oc-sdk-tone)",12)}; ${Io} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${g("var(--oc-sdk-tone)",9,F)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${g("var(--oc-sdk-tone)",11,F)}; box-shadow: none; }

.oc-sdk-field-note { color: ${m}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${At}; }
.oc-sdk-input { border-radius: ${kt}; background: var(--oc-sdk-field-bg); color: ${te}; ${yt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${m}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${C}, ${C}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${yt(g(L,26))} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${yt(h("status-error","red"))} }
.oc-sdk-input[data-mono="true"] { font-family: ${Rt}; }

.oc-sdk-search-icon { color: ${m}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${X}; }
.oc-sdk-search-clear { border-radius: ${wo}; color: ${m}; }
.oc-sdk-search-clear:hover { background: ${C}; color: ${L}; }

.oc-sdk-trigger { border-radius: ${kt}; background: var(--oc-sdk-raised-bg); color: ${te}; ${Ut} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${C}, ${C}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${V}, ${V}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${m}; }
.oc-sdk-trigger-chevron { color: ${m}; }
/* The app's dropdown light: lit top, hairline rings and a layered shadow. Its outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${te}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${Ge}; background-clip: padding-box; color: ${te}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${C}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${gt}; color: ${Ot}; }
.oc-sdk-option-check { color: ${L}; }
.oc-sdk-option[data-destructive="true"] { color: ${At}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${g(h("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${m}; }
.oc-sdk-popup-empty { color: ${m}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${B}; border-radius: 4px; color: ${L}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${g(L,60,B)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${B}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${F}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${X}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${Co} }
.oc-sdk-check-desc { color: ${m}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${g(L,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${m}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${L}; }
.oc-sdk-tab[aria-selected="true"] { color: ${Ot}; background: ${gt}; border-color: ${B}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${te}; background: var(--oc-sdk-raised-bg); ${Ut} }
.oc-sdk-tab-count { color: ${m}; }

.oc-sdk-badge { border-radius: 9999px; background: ${C}; color: ${m}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${g("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${C}; }
.oc-sdk-row[aria-selected="true"] { background: ${gt}; color: ${Ot}; }
.oc-sdk-row-lead { font-family: ${Rt}; color: ${m}; }
.oc-sdk-row-sub { color: ${m}; }
.oc-sdk-row-meta { color: ${m}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${m}; }

.oc-sdk-empty-body { color: ${m}; }

.oc-sdk-spinner { color: ${m}; }
.oc-sdk-spinner-ring { border-color: ${B}; border-top-color: ${X}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${g("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${m}; }

.oc-sdk-separator { color: ${m}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${g(B,40)}; }

.oc-sdk-progress-label { color: ${m}; }
.oc-sdk-progress-track { border-radius: 9999px; background: ${B}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${X}); }

.oc-sdk-text a { color: ${bt}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${g(B,60)}; }
`,y=`
${We}
${ur}
${No}`;var Go="oc-sdk-ui-style";var U=(e)=>{let r=document.getElementById(Go);if(r instanceof HTMLStyleElement){if(r.textContent!==e)r.textContent=e;return}Ke(document);let n=document.createElement("style");n.id=Go,n.textContent=e,document.head.appendChild(n)},v=(e,r)=>{let n=document.createElement(e);if(r)n.className=r;return n};var N=(e,r)=>{let n=r??"";if(e.textContent!==n)e.textContent=n},oe=(e,r,n)=>{if(n===void 0||n===null||n==="")e.removeAttribute(r);else if(e.getAttribute(r)!==n)e.setAttribute(r,n)};var wt=(e,r)=>{oe(e,"data-tone",r&&r!=="neutral"?r:null)},Ct=(e,r)=>{U(y);let n=r,u=v("span","oc-sdk oc-sdk-badge");e.append(u);let c=()=>{N(u,n.label),wt(u,n.tone)};return c(),{update:(f)=>{n={...n,...f},c()},dispose:()=>{u.remove()}}};function Sr(e){let r=/^(?:https?:\/\/(?:[^@/\s]+@)?github\.com\/|(?:ssh:\/\/)?git@github\.com[:/])([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(e.trim());return r?{owner:r[1],name:r[2]}:null}function Po(e){let r=/^\s*([\w.-]+)\/([\w.-]+)\s*$/.exec(e??"");return r?{owner:r[1],name:r[2]}:null}function Do(e){let r=[],n=null;for(let u of e.split(/\r?\n/)){let c=/^\s*\[remote\s+"([^"]+)"\]/.exec(u);if(c){n=c[1];continue}if(/^\s*\[/.test(u)){n=null;continue}let f=n?/^\s*url\s*=\s*(.+?)\s*$/.exec(u):null;if(n&&f)r.push({name:n,url:f[1]})}r.sort((u,c)=>Number(c.name==="origin")-Number(u.name==="origin"));for(let u of r){let c=Sr(u.url);if(c)return c}return null}function Ho(e){return/^\s*ref:\s*refs\/heads\/(.+?)\s*$/m.exec(e)?.[1]??null}function $o(e){let r=/^gitdir:\s*(.+?)\s*$/m.exec(e)?.[1];if(!r)return null;let n=r.lastIndexOf("/worktrees/");return{gitDir:r,commonDir:n<0?r:r.slice(0,n)}}function Lt(e,r){if(e!=="completed"){if(e==="in_progress")return{label:"running",tone:"info",active:!0};if(e==="waiting")return{label:"waiting",tone:"warning",active:!0};return{label:e.replace(/_/g," "),tone:"neutral",active:!0}}switch(r){case"success":return{label:"success",tone:"success",active:!1};case"failure":case"timed_out":case"startup_failure":return{label:r.replace(/_/g," "),tone:"error",active:!1};case"action_required":return{label:"action required",tone:"warning",active:!1};default:return{label:(r??"completed").replace(/_/g," "),tone:"neutral",active:!1}}}function Xo(e,r=Date.now()){let n=Math.round((r-Date.parse(e))/1000);if(!Number.isFinite(n))return"";if(n<60)return"just now";if(n<3600)return`${Math.floor(n/60)}m ago`;if(n<86400)return`${Math.floor(n/3600)}h ago`;return`${Math.floor(n/86400)}d ago`}var Fo="github-actions";class $e extends Error{status;constructor(e,r){super(r);this.status=e}}var Tr=(e)=>e instanceof $e&&(e.status===429||e.status===403&&/rate limit/i.test(e.message));function Bo(e){return async function(n,u,c,f){let O=await e.request({method:n,path:u,query:c,...f===void 0?{}:{body:JSON.stringify(f)}});if(O.status>=300){let k=`GitHub answered ${O.status}.`;try{k=JSON.parse(O.body).message??k}catch{}throw new $e(O.status,k)}return O.body?JSON.parse(O.body):null}}function Vo(e,r){if(e instanceof a&&e.code==="DISCONNECTED")return"GitHub refused the token. Add a new one in Settings → Integrations → GitHub Actions.";if(Tr(e))return"GitHub rate limit reached. Refreshing pauses for a few minutes.";if(e instanceof $e&&e.status===404&&r)return`${r.owner}/${r.name} is not visible to this token. Give the token access to this repository (fine-grained: Repository access + Actions read).`;return e instanceof Error?e.message:String(e)}async function ue(e,r){try{return(await e.readFile(r)).content}catch{return null}}async function jo(e,r){let n=await ue(e,".git/config"),u=await ue(e,".git/HEAD");if(n===null){let c=$o(await ue(e,".git")??"");if(c)n=await ue(e,`${c.commonDir}/config`),u=await ue(e,`${c.gitDir}/HEAD`)}return{repo:Po(r.repository)??(n?Do(n):null),branch:u?Ho(u):null}}var zo=`
html, body { margin: 0; background: transparent; color: var(--oc-fg); font-family: var(--oc-font); font-size: 12px; }
#root { display: flex; flex-direction: column; gap: 2px; padding: 4px 8px; }
.muted { color: var(--oc-muted); }
.status-error { color: var(--oc-error-text); }
.status-run {
  all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 8px;
  padding: 3px 4px; border-radius: var(--oc-radius); cursor: pointer;
}
.status-run:hover { background: var(--oc-hover); }
.status-run:focus-visible { outline: 2px solid var(--oc-focus); outline-offset: -2px; }
.status-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;var mr=3,hr=15000,xr=60000,W=ht(),gr=Bo(W),Wo=document.getElementById("root"),Ko=document.createElement("style");Ko.textContent=zo;document.head.append(Ko);var Mt=!1,Nt=null,Gt={},j={repo:null,branch:null},Pt,Xe=0;function z(e,r="muted"){let n=document.createElement("div");return n.className=r,n.textContent=e,n}function _e(e){Wo.replaceChildren(...e),W.setHeight(Math.ceil(Wo.getBoundingClientRect().height)+12).catch(()=>{return})}function Or(e){let r=Lt(e.status,e.conclusion),n=document.createElement("button");return n.type="button",n.className="status-run",n.title=e.display_title,n.addEventListener("click",()=>void W.openSurface(`plugin:${Fo}`).catch(()=>W.openUrl(e.html_url))),Ct(n.appendChild(document.createElement("span")),{label:r.label,tone:r.tone}),n.append(z(`${e.name} #${e.run_number}`,"status-name"),z(Xo(e.created_at))),n}async function Jo(){clearTimeout(Pt);let e=++Xe;if(!Mt)return _e([z("Connect GitHub in Settings → Integrations → GitHub Actions.")]);if(j=await jo(W,Gt),e!==Xe)return;if(!j.repo)return _e([z(Nt?"No github.com remote in this project.":"No project open.")]);if(!j.branch)return _e([z("Detached HEAD: no branch to follow.")]);let{owner:r,name:n}=j.repo,u=!1;try{let c=await gr("GET",`/repos/${r}/${n}/actions/runs`,{branch:j.branch,per_page:"10",exclude_pull_requests:"true"});if(e!==Xe)return;let f=c.workflow_runs.filter((O,k,G)=>G.findIndex((P)=>P.workflow_id===O.workflow_id)===k);u=f.some((O)=>Lt(O.status,O.conclusion).active),_e(f.length?f.slice(0,mr).map(Or):[z(`Nothing has run on ${j.branch} yet.`)])}catch(c){if(e!==Xe)return;_e([z(Vo(c,j.repo),"status-error")])}Pt=setTimeout(()=>void Jo(),u?hr:xr)}W.onReady((e)=>{xt(e,document.documentElement);let r=e.directory!==Nt||e.connection.connected!==Mt||JSON.stringify(e.settings)!==JSON.stringify(Gt);if(Nt=e.directory,Mt=e.connection.connected,Gt=e.settings,r)Jo()});window.addEventListener("beforeunload",()=>{clearTimeout(Pt),W.dispose()});})();
