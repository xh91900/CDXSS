import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Shift = { start: string; end: string; hours: number; staff: number };
type Inputs = {
    passingTraffic: number; captureRate: number; conversionRate: number; avgTicket: number; grossMargin: number; daysPerMonth: number;
    staffHourly: number; staffBudget: number; ownerSalary: number; rent: number; waterElectric: number; waste: number;
    area: number; rentDepositMonths: number; subwayMeters: number;
    franchiseFee: number; deposit: number; renovation: number; transferFee: number; openingInventory: number; openingPromotion: number;
    workingCapital: number; targetPaybackYears: number; maxInvestment: number; shifts: Shift[]
};

const defaults: Inputs = {
    passingTraffic: 7000, captureRate: 7, conversionRate: 45, avgTicket: 18, grossMargin: 26, daysPerMonth: 30,
    staffHourly: 23, staffBudget: 16000, ownerSalary: 7000, rent: 13000, waterElectric: 7000, waste: 2500,
    area: 70, rentDepositMonths: 2, subwayMeters: 500,
    franchiseFee: 50000, deposit: 50000, renovation: 130000, transferFee: 60000, openingInventory: 50000, openingPromotion: 10000,
    workingCapital: 111000, targetPaybackYears: 2.75, maxInvestment: 500000,
    shifts: [
        { start: "00:00", end: "07:00", hours: 7, staff: 1 }, { start: "07:00", end: "10:00", hours: 3, staff: 2 },
        { start: "10:00", end: "12:00", hours: 2, staff: 1 }, { start: "12:00", end: "14:00", hours: 2, staff: 2 },
        { start: "14:00", end: "17:00", hours: 3, staff: 1 }, { start: "17:00", end: "21:00", hours: 4, staff: 2 },
        { start: "21:00", end: "24:00", hours: 3, staff: 1 }
    ]
};

const money = (n: number) => Number.isFinite(n) ? `¥${Math.round(n).toLocaleString("zh-CN")}` : "—";
const integer = (n: number) => Number.isFinite(n) ? Math.round(n).toLocaleString("zh-CN") : "—";

function App() {
    const [i, setI] = React.useState<Inputs>(() => { try { return JSON.parse(localStorage.getItem("convenience-store-model-v03") || "null") || defaults } catch { return defaults } });
    React.useEffect(() => localStorage.setItem("convenience-store-model-v03", JSON.stringify(i)), [i]);
    const update = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setI(p => ({ ...p, [k]: v }));
    const updateShift = (n: number, p: Partial<Shift>) => setI(x => ({ ...x, shifts: x.shifts.map((s, j) => j === n ? { ...s, ...p } : s) }));
    const addShift = () => setI(x => ({ ...x, shifts: [...x.shifts, { start: "00:00", end: "00:00", hours: 1, staff: 1 }] }));
    const delShift = (n: number) => setI(x => ({ ...x, shifts: x.shifts.filter((_, j) => j !== n) }));

    const entries = i.passingTraffic * i.captureRate / 100, orders = entries * i.conversionRate / 100;
    const salesDay = orders * i.avgTicket, salesMonth = salesDay * i.daysPerMonth, gross = salesMonth * i.grossMargin / 100;
    const staffHoursDay = i.shifts.reduce((a, s) => a + s.hours * s.staff, 0), staffCost = staffHoursDay * i.daysPerMonth * i.staffHourly;
    const operating = i.rent + i.ownerSalary + i.waterElectric + i.waste + staffCost, profit = gross - operating, annual = profit * 12;
    const initial = i.franchiseFee + i.deposit + i.renovation + i.transferFee + i.openingInventory + i.openingPromotion + i.rent * i.rentDepositMonths;
    const capital = initial + i.workingCapital, payback = annual > 0 ? capital / annual : Infinity, roi = capital ? annual / capital : 0;
    const breakEvenDay = ((i.rent + i.ownerSalary + i.waterElectric + i.waste + staffCost) / (i.grossMargin / 100)) / i.daysPerMonth;
    const targetProfit = capital / (i.targetPaybackYears * 12);
    const targetDay = (targetProfit + i.rent + i.ownerSalary + i.waterElectric + i.waste + staffCost) / (i.grossMargin / 100) / i.daysPerMonth;
    const targetOrders = targetDay / i.avgTicket, targetEntries = targetOrders / (i.conversionRate / 100), targetTraffic = targetEntries / (i.captureRate / 100);
    const captureWarn = i.captureRate < 3 || i.captureRate > 8, conversionWarn = i.conversionRate < 22 || i.conversionRate > 55;
    const staffWarn = staffCost > i.staffBudget, capitalWarn = capital > i.maxInvestment;

    const exportData = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(i, null, 2)], { type: "application/json" })); a.download = "便利店经营模型-v0.3.json"; a.click() };
    const importData = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { setI(JSON.parse(String(r.result))) } catch { alert("JSON 文件格式不正确") } }; r.readAsText(f) };

    return <div className="app">
        <header><div><h1>便利店经营模型</h1><p>V0.3 · 本地计算 · 销售漏斗 + 人工排班 + 投资回本</p></div><div className="actions"><button onClick={exportData}>导出项目</button><label className="button">导入项目<input type="file" accept=".json" onChange={importData} /></label><button onClick={() => setI(defaults)}>恢复默认值</button></div></header>
        <div className="cards"><Metric title="预计日销售" value={money(salesDay)} note={`${integer(orders)} 单/天`} /><Metric title="预计月净利润" value={money(profit)} note={profit >= 0 ? "盈利" : "亏损"} danger={profit < 0} /><Metric title="预计回本周期" value={Number.isFinite(payback) ? payback.toFixed(2) + " 年" : "无法回本"} note={`目标 ${i.targetPaybackYears} 年`} /><Metric title="总资金占用" value={money(capital)} note={`上限 ${money(i.maxInvestment)}`} danger={capitalWarn} /></div>

        <section className="panel"><h2>① 销售与人工模型</h2><div className="two">
            <div><h3>销售漏斗</h3>
                <Field label="路过有效人流/天" value={i.passingTraffic} set={v => update("passingTraffic", v)} />
                <Field label="捕获率 / 入店率（%）" value={i.captureRate} step={.1} set={v => update("captureRate", v)} tipTitle="成都日系便利店捕获率参考" tip={<><b>地铁口 / 通勤要道：</b>6%–8%<br /><b>普通临街商办：</b>4%–6%<br /><b>纯社区 / 次街道：</b>3%–4%，差点位可能低于3%<br /><br />捕获率 = 路过门店的人中选择进入门店的比例。日系品牌优质点位通常很难长期超过8%。</>} />
                {captureWarn && <div className="warning">ⓘ 当前捕获率超出常见参考区间 3%–8%，请确认是否有真实数据支持。</div>}
                <Field label="进店成交率（%）" value={i.conversionRate} step={.1} set={v => update("conversionRate", v)} tipTitle="成都日系便利店成交率参考" tip={<><b>写字楼 / 地铁口：</b>35%–50%，优秀约55%<br /><b>商圈步行街：</b>22%–35%<br /><b>社区店：</b>40%–52%<br /><br />成交率 = 已进店的人中最终付款的比例。</>} />
                {conversionWarn && <div className="warning">ⓘ 当前成交率超出常见参考区间 22%–55%，建议结合实际 POS 数据验证。</div>}
                <Field label="客单价（元）" value={i.avgTicket} step={.1} set={v => update("avgTicket", v)} /><Field label="综合毛利率（%）" value={i.grossMargin} step={.1} set={v => update("grossMargin", v)} /><Field label="营业天数（月）" value={i.daysPerMonth} set={v => update("daysPerMonth", v)} />
                <div className="funnel"><FunnelRow label="路过人流" value={`${integer(i.passingTraffic)} 人/天`} /><FunnelRow label={`× 捕获率 ${i.captureRate}%`} value={`${integer(entries)} 人进店/天`} /><FunnelRow label={`× 成交率 ${i.conversionRate}%`} value={`${integer(orders)} 单/天`} /><FunnelRow label={`× 客单价 ¥${i.avgTicket}`} value={money(salesDay)} /></div>
                <div className="summary"><Row k="预计进店人数" v={`${integer(entries)} 人/天`} /><Row k="预计成交订单" v={`${integer(orders)} 单/天`} /><Row k="预计日销售" v={money(salesDay)} /><Row k="预计月销售" v={money(salesMonth)} /><Row k="预计月毛利" v={money(gross)} /></div>
            </div>
            <div><h3>人工排班</h3><div className="hint">人工成本 = 人数 × 小时 × 时薪 × 每月营业天数。开始/结束时间用于记录班次，小时数可手动修正。</div>
                <div className="shift head"><span>开始</span><span>结束</span><span>小时</span><span>人数</span><span></span></div>
                {i.shifts.map((s, n) => <div className="shift" key={n}><input type="time" value={s.start} onChange={e => updateShift(n, { start: e.target.value })} /><input type="time" value={s.end} onChange={e => updateShift(n, { end: e.target.value })} /><input type="number" min="0" step=".5" value={s.hours} onChange={e => updateShift(n, { hours: +e.target.value })} /><input type="number" min="1" max="10" value={s.staff} onChange={e => updateShift(n, { staff: +e.target.value })} /><button className="x" onClick={() => delShift(n)}>×</button></div>)}
                <button className="add" onClick={addShift}>＋ 添加排班</button>
                <div className="summary"><Row k="员工需求工时" v={`${staffHoursDay * i.daysPerMonth} h/月`} /><Row k="员工时薪" v={`${money(i.staffHourly)}/h`} /><Row k="员工人工成本" v={`${money(staffCost)}/月`} danger={staffWarn} /><Row k="员工预算" v={`${money(i.staffBudget)}/月`} /></div>
                {staffWarn && <div className="warning">⚠️ 当前排班超过员工人工预算 {money(staffCost - i.staffBudget)}，模型不会自动截断实际成本。</div>}
                <Field label="员工综合时薪（元/h）" value={i.staffHourly} step={.5} set={v => update("staffHourly", v)} /><Field label="员工人工预算（元/月）" value={i.staffBudget} set={v => update("staffBudget", v)} /><Field label="店长工资（元/月）" value={i.ownerSalary} set={v => update("ownerSalary", v)} />
            </div>
        </div></section>

        <section className="panel"><h2>② 目标反推与盈亏平衡</h2><div className="cards small"><Metric title="目标月利润" value={money(targetProfit)} /><Metric title="目标日销售" value={money(targetDay)} /><Metric title="目标订单/天" value={`${Math.ceil(targetOrders)} 单`} /><Metric title="所需路过人流/天" value={integer(targetTraffic)} /></div><div className="summary horizontal"><Row k="目标进店人数/天" v={integer(targetEntries)} /><Row k="盈亏平衡日销售" v={money(breakEvenDay)} /><Row k="盈亏平衡订单" v={`${Math.ceil(breakEvenDay / i.avgTicket)} 单/天`} /></div></section>

        <section className="panel"><h2>③ 店铺与经营成本</h2><div className="three">
            <div><h3>店铺</h3><Field label="店铺面积（㎡）" value={i.area} set={v => update("area", v)} /><Field label="月租（元）" value={i.rent} set={v => update("rent", v)} /><Field label="房租押金（月）" value={i.rentDepositMonths} set={v => update("rentDepositMonths", v)} /><Field label="距地铁（米）" value={i.subwayMeters} set={v => update("subwayMeters", v)} /></div>
            <div><h3>经营成本</h3><Field label="水电费（元/月）" value={i.waterElectric} set={v => update("waterElectric", v)} /><Field label="损耗（元/月）" value={i.waste} set={v => update("waste", v)} /></div>
            <div><h3>利润结果</h3><div className="summary no-top"><Row k="月经营成本" v={money(operating)} /><Row k="月净利润" v={money(profit)} danger={profit < 0} /><Row k="年净利润" v={money(annual)} /><Row k="ROI" v={`${(roi * 100).toFixed(1)}%`} /></div></div>
        </div></section>

        <section className="panel"><h2>④ 开店投资与目标</h2><div className="three">
            <div><Field label="加盟费（元）" value={i.franchiseFee} set={v => update("franchiseFee", v)} /><Field label="保证金（元）" value={i.deposit} set={v => update("deposit", v)} /><Field label="装修费（元）" value={i.renovation} set={v => update("renovation", v)} /></div>
            <div><Field label="转让费（元）" value={i.transferFee} set={v => update("transferFee", v)} /><Field label="首批库存（元）" value={i.openingInventory} set={v => update("openingInventory", v)} /><Field label="首月推广（元）" value={i.openingPromotion} set={v => update("openingPromotion", v)} /></div>
            <div><Field label="额外流动资金（元）" value={i.workingCapital} set={v => update("workingCapital", v)} /><Field label="最大资金上限（元）" value={i.maxInvestment} set={v => update("maxInvestment", v)} /><Field label="目标回本周期（年）" value={i.targetPaybackYears} step={.25} set={v => update("targetPaybackYears", v)} /></div>
        </div><div className="summary horizontal"><Row k="开店初始投入" v={money(initial)} /><Row k="总资金占用" v={money(capital)} danger={capitalWarn} /></div></section>
        <footer>V0.3 · 数据保存在本机浏览器 · 捕获率与成交率分开计算 · 损耗单独计算</footer>
    </div>
}

function Field({ label, value, set, step = 1, tipTitle, tip }: { label: string; value: number; set: (v: number) => void; step?: number; tipTitle?: string; tip?: React.ReactNode }) {
    return <label className="field"><span className="field-label">{label}{tip && <Tip title={tipTitle || "参考数据"}>{tip}</Tip>}</span><input type="number" step={step} value={value} onChange={e => set(+e.target.value)} /></label>
}
function Tip({ title, children }: { title: string; children: React.ReactNode }) { return <span className="tip"><button type="button" className="tip-button">i</button><span className="tip-pop"><strong>{title}</strong><br />{children}</span></span> }
function Row({ k, v, danger = false }: { k: string; v: string; danger?: boolean }) { return <div><span>{k}</span><b className={danger ? "danger" : ""}>{v}</b></div> }
function Metric({ title, value, note, danger = false }: { title: string; value: string; note?: string; danger?: boolean }) { return <div className={`metric ${danger ? "dangerBox" : ""}`}><span>{title}</span><strong>{value}</strong>{note && <small>{note}</small>}</div> }
function FunnelRow({ label, value }: { label: string; value: string }) { return <div className="funnel-row"><span>{label}</span><b>{value}</b></div> }
createRoot(document.getElementById("root")!).render(<App />);
