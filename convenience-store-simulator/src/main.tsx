import React from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

type Shift={start:string;end:string;hours:number;staff:number};
type Inputs={
 area:number;rent:number;rentDepositMonths:number;subwayMeters:number;
 avgTicket:number;grossMargin:number;ownerSalary:number;staffHourly:number;
 staffBudget:number;waterElectric:number;waste:number;franchiseFee:number;
 deposit:number;renovation:number;transferFee:number;openingInventory:number;
 openingPromotion:number;workingCapital:number;targetPaybackYears:number;
 maxInvestment:number;trafficPerDay:number;conversionRate:number;daysPerMonth:number;
 shifts:Shift[]
};

const defaults:Inputs={
 area:70,rent:13000,rentDepositMonths:2,subwayMeters:500,avgTicket:18,
 grossMargin:26,ownerSalary:7000,staffHourly:23,staffBudget:16000,
 waterElectric:7000,waste:2500,franchiseFee:50000,deposit:50000,
 renovation:130000,transferFee:60000,openingInventory:50000,
 openingPromotion:10000,workingCapital:111000,targetPaybackYears:2.75,
 maxInvestment:500000,trafficPerDay:7000,conversionRate:5,daysPerMonth:30,
 shifts:[
  {start:"00:00",end:"07:00",hours:7,staff:1},
  {start:"07:00",end:"10:00",hours:3,staff:2},
  {start:"10:00",end:"12:00",hours:2,staff:1},
  {start:"12:00",end:"14:00",hours:2,staff:2},
  {start:"14:00",end:"17:00",hours:3,staff:1},
  {start:"17:00",end:"21:00",hours:4,staff:2},
  {start:"21:00",end:"24:00",hours:3,staff:1}
 ]};

const money=(n:number)=>Number.isFinite(n)?`¥${Math.round(n).toLocaleString("zh-CN")}`:"—";
function App(){
 const [i,setI]=React.useState<Inputs>(()=>{try{const x=localStorage.getItem("store-sim-v02");return x?JSON.parse(x):defaults}catch{return defaults}});
 React.useEffect(()=>localStorage.setItem("store-sim-v02",JSON.stringify(i)),[i]);
 const update=<K extends keyof Inputs>(k:K,v:Inputs[K])=>setI(p=>({...p,[k]:v}));
 const shift=(n:number,p:Partial<Shift>)=>setI(x=>({...x,shifts:x.shifts.map((s,j)=>j===n?{...s,...p}:s)}));
 const add=()=>setI(x=>({...x,shifts:[...x.shifts,{start:"00:00",end:"00:00",hours:1,staff:1}]}));
 const del=(n:number)=>setI(x=>({...x,shifts:x.shifts.filter((_,j)=>j!==n)}));

 const staffHoursDay=i.shifts.reduce((a,s)=>a+s.hours*s.staff,0);
 const staffHoursMonth=staffHoursDay*i.daysPerMonth;
 const staffCost=staffHoursMonth*i.staffHourly;
 const ordersDay=i.trafficPerDay*i.conversionRate/100;
 const salesDay=ordersDay*i.avgTicket,salesMonth=salesDay*i.daysPerMonth;
 const gross=salesMonth*i.grossMargin/100;
 const fixed=i.rent+i.ownerSalary+i.waterElectric+i.waste;
 const profit=gross-fixed-staffCost,annual=profit*12;
 const initial=i.franchiseFee+i.deposit+i.renovation+i.transferFee+i.openingInventory+i.openingPromotion+i.rent*i.rentDepositMonths;
 const capital=initial+i.workingCapital,roi=capital?annual/capital:0,payback=annual>0?capital/annual:Infinity;
 const beMonth=(fixed+staffCost)/(i.grossMargin/100),beDay=beMonth/i.daysPerMonth,beOrders=beDay/i.avgTicket;
 const targetProfit=capital/(i.targetPaybackYears*12);
 const targetDay=(targetProfit+fixed+staffCost)/(i.grossMargin/100)/i.daysPerMonth;
 const targetOrders=targetDay/i.avgTicket;
 const targetTraffic=i.conversionRate?targetOrders/(i.conversionRate/100):Infinity;
 const reset=()=>setI(defaults);
 const exportData=()=>{const b=new Blob([JSON.stringify(i,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="便利店项目参数.json";a.click();URL.revokeObjectURL(u)};
 const importData=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setI(JSON.parse(String(r.result)))}catch{alert("JSON 文件格式不正确")}};r.readAsText(f)};
 return <div className="app">
  <header><div><h1>便利店经营模拟器</h1><p>V0.2 · 本地计算 · 参数可编辑 · 实时联动</p></div><div className="actions"><button onClick={exportData}>导出项目</button><label className="button">导入项目<input type="file" accept=".json" onChange={importData}/></label><button onClick={reset}>恢复默认值</button></div></header>
  <main>
   <div className="cards"><Metric title="预计日销售" value={money(salesDay)} note={`${Math.round(ordersDay)} 单/天`}/><Metric title="预计月净利润" value={money(profit)} danger={profit<0}/><Metric title="预计回本周期" value={Number.isFinite(payback)?`${payback.toFixed(2)} 年`:"无法回本"} note={`目标 ${i.targetPaybackYears} 年`}/><Metric title="总资金占用" value={money(capital)} danger={capital>i.maxInvestment}/></div>
   <section className="panel"><h2>① 销售与人工模型</h2><div className="two">
    <div><h3>销售参数</h3><Field label="有效人流/天" value={i.trafficPerDay} set={v=>update("trafficPerDay",v)}/><Field label="进店转化率（%）" value={i.conversionRate} step={.1} set={v=>update("conversionRate",v)}/><Field label="客单价（元）" value={i.avgTicket} step={.1} set={v=>update("avgTicket",v)}/><Field label="综合毛利率（%）" value={i.grossMargin} step={.1} set={v=>update("grossMargin",v)}/><Field label="营业天数（月）" value={i.daysPerMonth} set={v=>update("daysPerMonth",v)}/><div className="summary"><Row k="预计进店人数" v={`${Math.round(ordersDay)} 人/天`}/><Row k="预计日销售" v={money(salesDay)}/><Row k="预计月销售" v={money(salesMonth)}/><Row k="预计月毛利" v={money(gross)}/></div></div>
    <div><h3>人工排班</h3><div className="hint">每项按「人数 × 小时 × 时薪」计算。开始/结束时间用于记录班次，小时数可手动修正。</div><div className="shift head"><span>开始</span><span>结束</span><span>小时</span><span>人数</span><span></span></div>{i.shifts.map((s,n)=><div className="shift" key={n}><input type="time" value={s.start} onChange={e=>shift(n,{start:e.target.value})}/><input type="time" value={s.end} onChange={e=>shift(n,{end:e.target.value})}/><input type="number" min="0" step=".5" value={s.hours} onChange={e=>shift(n,{hours:+e.target.value})}/><input type="number" min="1" max="5" value={s.staff} onChange={e=>shift(n,{staff:+e.target.value})}/><button className="x" onClick={()=>del(n)}>×</button></div>)}<button className="add" onClick={add}>＋ 添加排班</button><div className="summary"><Row k="员工需求工时" v={`${staffHoursMonth.toFixed(0)} h/月`}/><Row k="员工时薪" v={`${money(i.staffHourly)}/h`}/><Row k="员工人工成本" v={`${money(staffCost)}/月`} danger={staffCost>i.staffBudget}/><Row k="员工预算" v={`${money(i.staffBudget)}/月`}/></div>{staffCost>i.staffBudget&&<div className="warning">⚠️ 当前排班超过员工人工预算 {money(staffCost-i.staffBudget)}，实际成本不会被截断。</div>}<Field label="员工综合时薪（元/h）" value={i.staffHourly} step={.5} set={v=>update("staffHourly",v)}/><Field label="员工人工预算（元/月）" value={i.staffBudget} set={v=>update("staffBudget",v)}/><Field label="店长工资（元/月）" value={i.ownerSalary} set={v=>update("ownerSalary",v)}/></div>
   </div></section>
   <section className="panel"><h2>② 店铺与经营成本</h2><div className="three"><div><h3>店铺</h3><Field label="店铺面积（㎡）" value={i.area} set={v=>update("area",v)}/><Field label="月租（元）" value={i.rent} set={v=>update("rent",v)}/><Field label="房租押金（月）" value={i.rentDepositMonths} set={v=>update("rentDepositMonths",v)}/><Field label="距地铁（米）" value={i.subwayMeters} set={v=>update("subwayMeters",v)}/></div><div><h3>经营成本</h3><Field label="水电费（元/月）" value={i.waterElectric} set={v=>update("waterElectric",v)}/><Field label="损耗（元/月）" value={i.waste} set={v=>update("waste",v)}/></div><div><h3>利润结果</h3><div className="summary no-top"><Row k="月经营成本" v={money(fixed+staffCost)}/><Row k="月净利润" v={money(profit)} danger={profit<0}/><Row k="年净利润" v={money(annual)}/><Row k="ROI" v={`${(roi*100).toFixed(1)}%`}/></div></div></div></section>
   <section className="panel"><h2>③ 开店投资与目标</h2><div className="three"><div><Field label="加盟费（元）" value={i.franchiseFee} set={v=>update("franchiseFee",v)}/><Field label="保证金（元）" value={i.deposit} set={v=>update("deposit",v)}/><Field label="装修费（元）" value={i.renovation} set={v=>update("renovation",v)}/></div><div><Field label="转让费（元）" value={i.transferFee} set={v=>update("transferFee",v)}/><Field label="首批库存（元）" value={i.openingInventory} set={v=>update("openingInventory",v)}/><Field label="首月推广（元）" value={i.openingPromotion} set={v=>update("openingPromotion",v)}/></div><div><Field label="额外流动资金（元）" value={i.workingCapital} set={v=>update("workingCapital",v)}/><Field label="最大资金上限（元）" value={i.maxInvestment} set={v=>update("maxInvestment",v)}/><Field label="目标回本周期（年）" value={i.targetPaybackYears} step={.25} set={v=>update("targetPaybackYears",v)}/></div></div><div className="summary horizontal"><Row k="开店初始投入" v={money(initial)}/><Row k="总资金占用" v={money(capital)} danger={capital>i.maxInvestment}/></div></section>
   <section className="panel"><h2>④ 目标反推与盈亏平衡</h2><div className="cards small"><Metric title="目标月利润" value={money(targetProfit)}/><Metric title="目标日销售" value={money(targetDay)}/><Metric title="目标订单/天" value={`${Math.ceil(targetOrders)} 单`}/><Metric title="所需有效人流/天" value={Number.isFinite(targetTraffic)?Math.ceil(targetTraffic).toLocaleString():"—"}/></div><div className="summary horizontal"><Row k="盈亏平衡月销售" v={money(beMonth)}/><Row k="盈亏平衡日销售" v={money(beDay)}/><Row k="盈亏平衡订单" v={`${Math.ceil(beOrders)} 单/天`}/></div></section>
  </main><footer>V0.2 · 数据保存在本机浏览器 · 损耗单独计算 · 设备费用按总部提供处理</footer>
 </div>
}
function Field({label,value,set,step=1}:{label:string,value:number,set:(v:number)=>void,step?:number}){return <label className="field"><span>{label}</span><input type="number" step={step} value={value} onChange={e=>set(+e.target.value)}/></label>}
function Row({k,v,danger=false}:{k:string,v:string,danger?:boolean}){return <div><span>{k}</span><b className={danger?"danger":""}>{v}</b></div>}
function Metric({title,value,note,danger=false}:{title:string,value:string,note?:string,danger?:boolean}){return <div className={`metric ${danger?"dangerBox":""}`}><span>{title}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div>}
createRoot(document.getElementById("root")!).render(<App/>);
