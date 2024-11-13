(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[974],{49060:(e,r,t)=>{Promise.resolve().then(t.bind(t,24816))},24816:(e,r,t)=>{"use strict";t.d(r,{default:()=>k});var a=t(23528),l=t(25316),s=t(33410),n=t(27825),o=t.n(n),d=t(80565),i=t.n(d),c=t(11819),u=t.n(c),h=t(22438),x=t.n(h),p=t(827),f=t.n(p),m=t(63058),g=t.n(m),v=t(23133),y=t.n(v),j=t(64927),b=t(18733);function w(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return(0,b.QP)((0,j.$)(r))}let N=l.forwardRef((e,r)=>{let{className:t,...l}=e;return(0,a.jsx)("div",{ref:r,className:w("rounded-xl border bg-card text-card-foreground shadow",t),...l})});N.displayName="Card",l.forwardRef((e,r)=>{let{className:t,...l}=e;return(0,a.jsx)("div",{ref:r,className:w("flex flex-col space-y-1.5 p-6",t),...l})}).displayName="CardHeader",l.forwardRef((e,r)=>{let{className:t,...l}=e;return(0,a.jsx)("div",{ref:r,className:w("font-semibold leading-none tracking-tight",t),...l})}).displayName="CardTitle",l.forwardRef((e,r)=>{let{className:t,...l}=e;return(0,a.jsx)("div",{ref:r,className:w("text-sm text-muted-foreground",t),...l})}).displayName="CardDescription",l.forwardRef((e,r)=>{let{className:t,...l}=e;return(0,a.jsx)("div",{ref:r,className:w("p-6 pt-0",t),...l})}).displayName="CardContent",l.forwardRef((e,r)=>{let{className:t,...l}=e;return(0,a.jsx)("div",{ref:r,className:w("flex items-center p-6 pt-0",t),...l})}).displayName="CardFooter",o()(s.A),i()(s.A),u()(s.A),x()(s.A),f()(s.A),g()(s.A),y()(s.A);let k=()=>{let e=(0,l.useRef)(null),[r,t]=(0,l.useState)("chessboard"),[n,o]=(0,l.useState)("straight"),[d,i]=(0,l.useState)(!1),c=()=>{if(!e.current){e.current=(0,s.A)({container:document.getElementById("cy"),style:[{selector:"node",style:{width:20,height:20,shape:"rectangle",label:"data(id)","text-valign":"center","text-halign":"center","background-color":e=>e.data("isDark")?"#B58863":"#F0D9B5",color:e=>e.data("isDark")?"white":"black","border-color":"#262D31","border-width":1}},{selector:"edge",style:{width:1,"line-color":"#15465C","curve-style":n,"source-arrow-shape":d?"triangle":"none","target-arrow-shape":d?"triangle":"none","arrow-scale":.6}}]});let r=["a","b","c","d","e","f","g","h"],t=["1","2","3","4","5","6","7","8"],a=[];for(let e=0;e<8;e++)for(let l=0;l<8;l++)a.push({data:{id:"".concat(r[e]).concat(t[l]),isDark:(e+l)%2==0}});let l=[],o=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];a.forEach(e=>{let a=r.indexOf(e.data.id[0]),s=t.indexOf(e.data.id[1]);o.forEach(n=>{let[o,d]=n,i=a+o,c=s+d;if(i>=0&&i<8&&c>=0&&c<8){let a="".concat(r[i]).concat(t[c]);e.data.id<a&&l.push({data:{source:e.data.id,target:a}})}})}),e.current.add([...a,...l]),u()}},u=()=>{if(e.current){if("chessboard"===r){let r={};e.current.nodes().forEach(e=>{let t=e.id(),a=t.charCodeAt(0)-97,l=parseInt(t[1],10)-1;r[t]={x:80*a,y:(7-l)*80}}),e.current.layout({name:"preset",positions:r,fit:!0}).run()}else if("elk-layered"===r||"elk-mrtree"===r){let t={name:"elk",elk:{algorithm:r.split("-")[1]},fit:!0};e.current.layout(t).run()}else e.current.layout({name:r,fit:!0,padding:30,randomize:"random"===r,componentSpacing:40,nodeOverlap:20,refresh:20,nodeRepulsion:()=>4500,ideaForce:()=>400}).run()}},h=()=>{e.current&&e.current.style().selector("edge").style({"curve-style":n,"source-arrow-shape":d?"triangle":"none","target-arrow-shape":d?"triangle":"none"}).update()};return(0,l.useEffect)(()=>(c(),()=>{e.current&&e.current.destroy()}),[]),(0,l.useEffect)(()=>{u()},[r]),(0,l.useEffect)(()=>{h()},[n,d]),(0,a.jsxs)(N,{className:"p-4 w-full max-w-3xl mx-auto",children:[(0,a.jsxs)("div",{className:"text-center mb-4",children:[(0,a.jsx)("h2",{className:"text-2xl font-bold",children:"Knight's Move Graph"}),(0,a.jsx)("p",{className:"text-sm text-gray-600",children:"Visualization of possible knight moves on a chess board"})]}),(0,a.jsxs)("div",{className:"mb-4 text-center",children:[(0,a.jsx)("label",{htmlFor:"layout-select",className:"mr-2",children:"Choose Layout:"}),(0,a.jsxs)("select",{id:"layout-select",value:r,onChange:e=>t(e.target.value),className:"border rounded px-2 py-1",children:[(0,a.jsx)("option",{value:"chessboard",children:"Chessboard"}),(0,a.jsx)("option",{value:"cose",children:"Cose"}),(0,a.jsx)("option",{value:"cose-bilkent",children:"Cose-Bilkent"}),(0,a.jsx)("option",{value:"cola",children:"Cola"}),(0,a.jsx)("option",{value:"avsdf",children:"Avsdf"}),(0,a.jsx)("option",{value:"dagre",children:"Dagre"}),(0,a.jsx)("option",{value:"breadthfirst",children:"Breadthfirst"}),(0,a.jsx)("option",{value:"elk-layered",children:"ELK (Layered)"}),(0,a.jsx)("option",{value:"elk-mrtree",children:"ELK (mrtree)"}),(0,a.jsx)("option",{value:"fcose",children:"fCoSE"}),(0,a.jsx)("option",{value:"klay",children:"Klay"}),(0,a.jsx)("option",{value:"random",children:"Random"})]})]}),(0,a.jsxs)("div",{className:"mb-4 text-center",children:[(0,a.jsx)("label",{htmlFor:"edge-style-select",className:"mr-2",children:"Edge Style:"}),(0,a.jsxs)("select",{id:"edge-style-select",value:n,onChange:e=>o(e.target.value),className:"border rounded px-2 py-1",children:[(0,a.jsx)("option",{value:"straight",children:"Straight"}),(0,a.jsx)("option",{value:"taxi",children:"Taxi"}),(0,a.jsx)("option",{value:"bezier",children:"Bezier"}),(0,a.jsx)("option",{value:"unbundled-bezier",children:"Unbundled Bezier"}),(0,a.jsx)("option",{value:"segments",children:"Segments"})]})]}),(0,a.jsxs)("div",{className:"mb-4 text-center",children:[(0,a.jsx)("input",{type:"checkbox",id:"show-arrows",checked:d,onChange:e=>i(e.target.checked),className:"mr-2"}),(0,a.jsx)("label",{htmlFor:"show-arrows",children:"Show Arrow Heads"})]}),(0,a.jsx)("div",{id:"cy",style:{width:"600px",height:"600px",border:"1px solid #ccc"}})]})}}},e=>{var r=r=>e(e.s=r);e.O(0,[758,693,613,953,465,743,358],()=>r(49060)),_N_E=e.O()}]);