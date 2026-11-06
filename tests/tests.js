const C=require('../js/core.js'),assert=require('assert');
const ex={nq:4,nopt:4,marks:1,neg:0.25,pass:50,key:'ABCD'};
let g=C.grade(ex,[0,1,2,3]);assert.equal(g.s,4);assert(g.pass);
g=C.grade(ex,[0,0,-1,-1]);assert.equal(g.s,0.75);assert.equal(g.b,2);
g=C.grade(ex,[1,1,1,1]);assert.equal(g.s,0.25);
const rows=[[0,1,2,3],[0,1,2,0],[0,1,0,0],[0,0,0,0]];const st=C.itemStats(ex,rows);
assert.equal(st.items[0].p,1);assert.equal(st.items[3].p,.25);assert.equal(st.items[3].D,null);
const tot=[4,3,2,1],v=C.sd(tot)**2,pq=.1875+.5*.5*0+0;// KR20 check
const p=[1,.75,.5,.25],spq=p.reduce((s,x)=>s+x*(1-x),0);assert(Math.abs(st.kr-(4/3)*(1-spq/v))<1e-9);
const H=C.homography([[0,0],[10,0],[10,10],[0,10]],[[5,5],[25,5],[25,25],[5,25]]);const[a,b]=H(5,5);assert(Math.abs(a-15)<1e-6&&Math.abs(b-15)<1e-6);
console.log('all tests passed');
