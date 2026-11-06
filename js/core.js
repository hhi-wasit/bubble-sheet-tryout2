const Core=(()=>{
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))},med=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const FID=[[15,15],[195,15],[195,282],[15,282]];
const qpos=(i,k)=>[22+(i/20|0)*62+10+k*7,125+i%20*7], idpos=(c,d)=>[30+c*7,62+d*6];
function grade(ex,ans){let s=0,c=0,w=0,b=0;ans.forEach((a,i)=>{if(a<0)b++;else if(a===ex.key.charCodeAt(i)-65){c++;s+=ex.marks}else{w++;s-=ex.neg}});s=Math.max(0,s);const max=ex.nq*ex.marks;return{s,c,w,b,max,pct:100*s/max,pass:100*s/max>=ex.pass}}
function itemStats(ex,rows){const n=rows.length,k=ex.nq;if(!n)return null;
const cor=rows.map(a=>a.map((v,i)=>v===ex.key.charCodeAt(i)-65?1:0)),tot=cor.map(r=>r.reduce((x,y)=>x+y,0));
const g=Math.max(1,Math.ceil(n*.27)),ord=tot.map((_,i)=>i).sort((a,b)=>tot[b]-tot[a]);
const items=[...Array(k)].map((_,i)=>{const p=mean(cor.map(r=>r[i]));let D=null;if(n>=10)D=mean(ord.slice(0,g).map(j=>cor[j][i]))-mean(ord.slice(-g).map(j=>cor[j][i]));
const dist=Array(ex.nopt+1).fill(0);rows.forEach(a=>dist[a[i]<0?ex.nopt:a[i]]++);return{p,D,dist}});
const v=sd(tot)**2,spq=items.reduce((s,x)=>s+x.p*(1-x.p),0),kr=n>=2&&v>0&&k>1?k/(k-1)*(1-spq/v):null;
return{items,kr,n,sem:kr==null?null:sd(tot)*Math.sqrt(Math.max(0,1-kr))}}
function homography(src,dst){const A=[],b=[];src.forEach(([x,y],i)=>{const[u,v]=dst[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)});
for(let i=0;i<8;i++){let m=i;for(let j=i+1;j<8;j++)if(Math.abs(A[j][i])>Math.abs(A[m][i]))m=j;[A[i],A[m]]=[A[m],A[i]];[b[i],b[m]]=[b[m],b[i]];
for(let j=0;j<8;j++)if(j!=i){const f=A[j][i]/A[i][i];for(let k=i;k<8;k++)A[j][k]-=f*A[i][k];b[j]-=f*b[i]}}
const h=b.map((v,i)=>v/A[i][i]);return(x,y)=>{const w=h[6]*x+h[7]*y+1;return[(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w]}}
const api={mean,sd,med,FID,qpos,idpos,grade,itemStats,homography};if(typeof module!='undefined')module.exports=api;return api})();
