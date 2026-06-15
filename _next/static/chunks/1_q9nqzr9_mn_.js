(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,59344,e=>{"use strict";var t=e.i(43476),a=e.i(71645);e.s(["default",0,function(){let[e,l]=(0,a.useState)(""),[n,o]=(0,a.useState)("untitled.txt"),[r,s]=(0,a.useState)(!1),[c,i]=(0,a.useState)(!0),[d,u]=(0,a.useState)(!0),p=(0,a.useRef)(null),h=(0,a.useRef)(null),m=(0,a.useRef)(null),b=e.split("\n").length,f=(0,a.useCallback)(e=>{l(e.target.value),u(!1)},[]),x=(0,a.useCallback)(()=>{try{localStorage.setItem(`notepad-${n}`,e),u(!0)}catch{}},[e,n]),k=(0,a.useCallback)(()=>{l(""),o("untitled.txt"),u(!0)},[]),w=(0,a.useCallback)(()=>{let t=new Blob([e],{type:"text/plain"}),a=URL.createObjectURL(t),l=document.createElement("a");l.href=a,l.download=n,l.click(),URL.revokeObjectURL(a)},[e,n]),C=(0,a.useCallback)(()=>{let t=window.open("","_blank");t&&(t.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${n}</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      margin: 2.5cm;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
    }
  </style>
</head>
<body>${e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</body>
</html>`),t.document.close(),t.focus(),t.print())},[e,n]),g=(0,a.useCallback)(()=>{s(!1),n.trim()||o("untitled.txt")},[n]),v=(0,a.useCallback)(()=>{p.current&&h.current&&(h.current.scrollTop=p.current.scrollTop)},[]);return(0,a.useEffect)(()=>{r&&m.current&&(m.current.focus(),m.current.select())},[r]),(0,a.useEffect)(()=>{let e=e=>{(e.ctrlKey||e.metaKey)&&"s"===e.key&&(e.preventDefault(),x())};return window.addEventListener("keydown",e),()=>window.removeEventListener("keydown",e)},[x]),(0,t.jsxs)("div",{className:"notepad-container",children:[(0,t.jsxs)("div",{className:"notepad-toolbar",children:[(0,t.jsx)("button",{className:"notepad-btn",onClick:k,title:"New",children:"New"}),(0,t.jsx)("button",{className:"notepad-btn",onClick:x,title:"Save (Ctrl+S)",children:"Save"}),(0,t.jsx)("button",{className:"notepad-btn",onClick:w,title:"Download",children:"Download"}),(0,t.jsx)("button",{className:"notepad-btn",onClick:C,title:"Export PDF",children:"Export PDF"}),(0,t.jsx)("div",{className:"notepad-spacer"}),(0,t.jsxs)("label",{className:"notepad-toggle",children:[(0,t.jsx)("input",{type:"checkbox",checked:c,onChange:e=>i(e.target.checked)}),"Wrap"]})]}),(0,t.jsx)("div",{className:"notepad-filename",onClick:()=>s(!0),children:r?(0,t.jsx)("input",{ref:m,className:"notepad-filename-input",value:n,onChange:e=>o(e.target.value),onBlur:g,onKeyDown:e=>{"Enter"===e.key&&g()},onClick:e=>e.stopPropagation()}):(0,t.jsxs)("span",{children:[n,d?"":" *"]})}),(0,t.jsxs)("div",{className:"notepad-editor",children:[(0,t.jsx)("div",{className:"notepad-line-numbers",ref:h,children:Array.from({length:b},(e,a)=>(0,t.jsx)("div",{children:a+1},a))}),(0,t.jsx)("textarea",{ref:p,className:"notepad-textarea",value:e,onChange:f,onScroll:v,wrap:c?"soft":"off",spellCheck:!1,placeholder:"Start typing..."})]})]})}])}]);