import{r as s}from"./vendor-BStAX1aO.js";var C={exports:{}},f={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var h=s,R=Symbol.for("react.element"),x=Symbol.for("react.fragment"),S=Object.prototype.hasOwnProperty,v=h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,w={key:!0,ref:!0,__self:!0,__source:!0};function _(e,r,o){var t,n={},l=null,i=null;o!==void 0&&(l=""+o),r.key!==void 0&&(l=""+r.key),r.ref!==void 0&&(i=r.ref);for(t in r)S.call(r,t)&&!w.hasOwnProperty(t)&&(n[t]=r[t]);if(e&&e.defaultProps)for(t in r=e.defaultProps,r)n[t]===void 0&&(n[t]=r[t]);return{$$typeof:R,type:e,key:l,ref:i,props:n,_owner:v.current}}f.Fragment=x;f.jsx=_;f.jsxs=_;C.exports=f;var m=C.exports;function y(e,r){if(typeof e=="function")return e(r);e!=null&&(e.current=r)}function E(...e){return r=>{let o=!1;const t=e.map(n=>{const l=y(n,r);return!o&&typeof l=="function"&&(o=!0),l});if(o)return()=>{for(let n=0;n<t.length;n++){const l=t[n];typeof l=="function"?l():y(e[n],null)}}}}function T(...e){return s.useCallback(E(...e),e)}function b(e){const r=O(e),o=s.forwardRef((t,n)=>{const{children:l,...i}=t,a=s.Children.toArray(l),u=a.find(k);if(u){const c=u.props.children,p=a.map(d=>d===u?s.Children.count(c)>1?s.Children.only(null):s.isValidElement(c)?c.props.children:null:d);return m.jsx(r,{...i,ref:n,children:s.isValidElement(c)?s.cloneElement(c,void 0,p):null})}return m.jsx(r,{...i,ref:n,children:l})});return o.displayName=`${e}.Slot`,o}var V=b("Slot");function O(e){const r=s.forwardRef((o,t)=>{const{children:n,...l}=o;if(s.isValidElement(n)){const i=I(n),a=L(l,n.props);return n.type!==s.Fragment&&(a.ref=t?E(t,i):i),s.cloneElement(n,a)}return s.Children.count(n)>1?s.Children.only(null):null});return r.displayName=`${e}.SlotClone`,r}var j=Symbol("radix.slottable");function k(e){return s.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===j}function L(e,r){const o={...r};for(const t in r){const n=e[t],l=r[t];/^on[A-Z]/.test(t)?n&&l?o[t]=(...a)=>{const u=l(...a);return n(...a),u}:n&&(o[t]=n):t==="style"?o[t]={...n,...l}:t==="className"&&(o[t]=[n,l].filter(Boolean).join(" "))}return{...e,...o}}function I(e){var t,n;let r=(t=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:t.get,o=r&&"isReactWarning"in r&&r.isReactWarning;return o?e.ref:(r=(n=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:n.get,o=r&&"isReactWarning"in r&&r.isReactWarning,o?e.props.ref:e.props.ref||e.ref)}/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),g=(...e)=>e.filter((r,o,t)=>!!r&&r.trim()!==""&&t.indexOf(r)===o).join(" ").trim();/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var N={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=s.forwardRef(({color:e="currentColor",size:r=24,strokeWidth:o=2,absoluteStrokeWidth:t,className:n="",children:l,iconNode:i,...a},u)=>s.createElement("svg",{ref:u,...N,width:r,height:r,stroke:e,strokeWidth:t?Number(o)*24/Number(r):o,className:g("lucide",n),...a},[...i.map(([c,p])=>s.createElement(c,p)),...Array.isArray(l)?l:[l]]));/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=(e,r)=>{const o=s.forwardRef(({className:t,...n},l)=>s.createElement(P,{ref:l,iconNode:r,className:g(`lucide-${A(e)}`,t),...n}));return o.displayName=`${e}`,o};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=$("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);export{B as L,V as S,b as c,m as j,T as u};
