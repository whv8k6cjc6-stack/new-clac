import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// localStorage 儲存層（PWA 本機儲存）
const storageShim = {
  async get(k){const v=localStorage.getItem(k);return v?{key:k,value:v}:null;},
  async set(k,v){localStorage.setItem(k,v);return{key:k,value:v};},
  async delete(k){localStorage.removeItem(k);return{key:k,deleted:true};},
};
if(typeof window!=="undefined"&&!window.storage)window.storage=storageShim;


// ════ 商品資料（台灣期交所，315筆，依股票代號排序）════
const SD=[
{i:'ny_0050',c:'NY',s:'0050',n:'元大台灣50ETF期',sn:'元大台灣50ETF',fn:'元大台灣卓越50證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:true},
{i:'sr_0050',c:'SR',s:'0050',n:'小型元大台灣50ETF期',sn:'小元大台灣50ETF',fn:'元大台灣卓越50證券投資信託基金',cat:'small_etf',tl:'小型ETF期貨',spl:1000,ns:true},
{i:'vh_0052',c:'VH',s:'0052',n:'富邦科技ETF期',sn:'富邦科技ETF',fn:'富邦台灣科技指數證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'pf_0056',c:'PF',s:'0056',n:'元大高股息ETF期',sn:'元大高股息ETF',fn:'元大台灣高股息證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'ss_0056',c:'SS',s:'0056',n:'小型元大高股息ETF期',sn:'小元大高股息ETF',fn:'元大台灣高股息證券投資信託基金',cat:'small_etf',tl:'小型ETF期貨',spl:1000,ns:false},
{i:'oj_00636',c:'OJ',s:'00636',n:'國泰中國A50ETF期',sn:'國泰中國A50ETF',fn:'國泰富時中國A50證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'ok_00639',c:'OK',s:'00639',n:'富邦深100ETF期',sn:'富邦深100ETF',fn:'富邦深証100證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'oo_00643',c:'OO',s:'00643',n:'群益深証中小ETF期',sn:'群益深証中小ETF',fn:'群益深証中小板證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'ur_00757',c:'UR',s:'00757',n:'統一FANG+ETF期',sn:'統一FANG+ETF',fn:'統一NYSE FANG+ ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'us_00757',c:'US',s:'00757',n:'小型統一FANG+ETF期',sn:'小統一FANG+ETF',fn:'統一NYSE FANG+ ETF證券投資信託基金',cat:'small_etf',tl:'小型ETF期貨',spl:1000,ns:false},
{i:'ri_00878',c:'RI',s:'00878',n:'國泰永續高股息ETF期',sn:'國泰永續高股息ETF',fn:'國泰台灣高股息傘型證券投資信託基金之台灣ESG永續高股息ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'rx_00885',c:'RX',s:'00885',n:'富邦越南ETF期',sn:'富邦越南ETF',fn:'富邦富時越南證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'sg_00893',c:'SG',s:'00893',n:'國泰智能電動車ETF期',sn:'國泰智能電動車ETF',fn:'國泰全球智能電動車ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'sm_00919',c:'SM',s:'00919',n:'群益台灣精選高息ETF期',sn:'群益台灣精選高息ETF',fn:'群益台灣精選高息ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'ry_00923',c:'RY',s:'00923',n:'群益台ESG低碳50ETF期',sn:'群益台ESG低碳50ETF',fn:'群益台灣ESG低碳50ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'sn_00929',c:'SN',s:'00929',n:'復華台灣科技優息ETF期',sn:'復華台灣科技優息ETF',fn:'復華台灣科技優息ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'su_00940',c:'SU',s:'00940',n:'元大台灣價值高息ETF期',sn:'元大台灣價值高息ETF',fn:'元大臺灣價值高息ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'df_1101',c:'DF',s:'1101',n:'台泥期',sn:'台泥',fn:'臺灣水泥股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dy_1102',c:'DY',s:'1102',n:'亞泥期',sn:'亞泥',fn:'亞洲水泥股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dz_1210',c:'DZ',s:'1210',n:'大成期',sn:'大成',fn:'大成長城企業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cq_1216',c:'CQ',s:'1216',n:'統一期',sn:'統一',fn:'統一企業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cf_1301',c:'CF',s:'1301',n:'台塑期',sn:'台塑',fn:'台灣塑膠工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ca_1303',c:'CA',s:'1303',n:'南亞期',sn:'南亞',fn:'南亞塑膠工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ee_1312',c:'EE',s:'1312',n:'國喬期',sn:'國喬',fn:'國喬石油化學股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'eg_1314',c:'EG',s:'1314',n:'中石化期',sn:'中石化',fn:'中國石油化學工業開發股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'eh_1319',c:'EH',s:'1319',n:'東陽期',sn:'東陽',fn:'東陽實業廠股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dg_1326',c:'DG',s:'1326',n:'台化期',sn:'台化',fn:'台灣化學纖維股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cr_1402',c:'CR',s:'1402',n:'遠東新期',sn:'遠東新',fn:'遠東新世紀股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ek_1440',c:'EK',s:'1440',n:'南紡期',sn:'南紡',fn:'臺南紡織股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lw_1476',c:'LW',s:'1476',n:'儒鴻期',sn:'儒鴻',fn:'儒鴻企業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ks_1477',c:'KS',s:'1477',n:'聚陽期',sn:'聚陽',fn:'聚陽實業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sc_1477',c:'SC',s:'1477',n:'小型聚陽期',sn:'小聚陽',fn:'聚陽實業股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ua_1503',c:'UA',s:'1503',n:'士電期',sn:'士電',fn:'士林電機廠股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'em_1504',c:'EM',s:'1504',n:'東元期',sn:'東元',fn:'東元電機股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sd_1513',c:'SD',s:'1513',n:'中興電期',sn:'中興電',fn:'中興電工機械股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'or_1536',c:'OR',s:'1536',n:'和大期',sn:'和大',fn:'和大工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'eo_1560',c:'EO',s:'1560',n:'中砂期',sn:'中砂',fn:'中國砂輪企業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'my_1565',c:'MY',s:'1565',n:'精華期',sn:'精華',fn:'精華光學股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'om_1565',c:'OM',s:'1565',n:'小型精華期',sn:'小精華',fn:'精華光學股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ep_1590',c:'EP',s:'1590',n:'亞德客-KY期',sn:'亞德客-KY',fn:'亞德客國際集團',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cs_1605',c:'CS',s:'1605',n:'華新期',sn:'華新',fn:'華新麗華股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'va_1608',c:'VA',s:'1608',n:'華榮期',sn:'華榮',fn:'華榮電線電纜股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rj_1609',c:'RJ',s:'1609',n:'大亞期',sn:'大亞',fn:'大亞電線電纜股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qo_1717',c:'QO',s:'1717',n:'長興期',sn:'長興',fn:'長興材料工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ey_1718',c:'EY',s:'1718',n:'中纖期',sn:'中纖',fn:'中國人造纖維股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ez_1722',c:'EZ',s:'1722',n:'台肥期',sn:'台肥',fn:'台灣肥料股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sa_1795',c:'SA',s:'1795',n:'美時期',sn:'美時',fn:'美時化學製藥股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ku_1802',c:'KU',s:'1802',n:'台玻期',sn:'台玻',fn:'台灣玻璃工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qp_1904',c:'QP',s:'1904',n:'正隆期',sn:'正隆',fn:'正隆股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sb_1905',c:'SB',s:'1905',n:'華紙期',sn:'華紙',fn:'中華紙漿股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qk_1907',c:'QK',s:'1907',n:'永豐餘期',sn:'永豐餘',fn:'永豐餘投資控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'os_1909',c:'OS',s:'1909',n:'榮成期',sn:'榮成',fn:'榮成紙業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cb_2002',c:'CB',s:'2002',n:'中鋼期',sn:'中鋼',fn:'中國鋼鐵股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fb_2006',c:'FB',s:'2006',n:'東和鋼鐵期',sn:'東和鋼鐵',fn:'東和鋼鐵企業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fc_2014',c:'FC',s:'2014',n:'中鴻期',sn:'中鴻',fn:'中鴻鋼鐵股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fe_2027',c:'FE',s:'2027',n:'大成鋼期',sn:'大成鋼',fn:'大成不銹鋼工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ff_2049',c:'FF',s:'2049',n:'上銀期',sn:'上銀',fn:'上銀科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qm_2049',c:'QM',s:'2049',n:'小型上銀期',sn:'小上銀',fn:'上銀科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'fg_2059',c:'FG',s:'2059',n:'川湖期',sn:'川湖',fn:'川湖科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sv_2059',c:'SV',s:'2059',n:'小型川湖期',sn:'小川湖',fn:'川湖科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'fk_2105',c:'FK',s:'2105',n:'正新期',sn:'正新',fn:'正新橡膠工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fn_2201',c:'FN',s:'2201',n:'裕隆期',sn:'裕隆',fn:'裕隆汽車製造股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'od_2231',c:'OD',s:'2231',n:'為升期',sn:'為升',fn:'為升電裝工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fq_2301',c:'FQ',s:'2301',n:'光寶科期',sn:'光寶科',fn:'光寶科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cc_2303',c:'CC',s:'2303',n:'聯電期',sn:'聯電',fn:'聯華電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:true},
{i:'fr_2308',c:'FR',s:'2308',n:'台達電期',sn:'台達電',fn:'台達電子工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rv_2308',c:'RV',s:'2308',n:'小型台達電期',sn:'小台達電',fn:'台達電子工業股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'fs_2312',c:'FS',s:'2312',n:'金寶期',sn:'金寶',fn:'金寶電子工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ft_2313',c:'FT',s:'2313',n:'華通期',sn:'華通',fn:'華通電腦股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dh_2317',c:'DH',s:'2317',n:'鴻海期',sn:'鴻海',fn:'鴻海精密工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cu_2323',c:'CU',s:'2323',n:'中環期',sn:'中環',fn:'中環股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cg_2324',c:'CG',s:'2324',n:'仁寶期',sn:'仁寶',fn:'仁寶電腦工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lx_2327',c:'LX',s:'2327',n:'國巨期',sn:'國巨',fn:'國巨股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qe_2327',c:'QE',s:'2327',n:'小型國巨期',sn:'小國巨',fn:'國巨股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'kw_2328',c:'KW',s:'2328',n:'廣宇期',sn:'廣宇',fn:'廣宇科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ux_2329',c:'UX',s:'2329',n:'華泰期',sn:'華泰',fn:'華泰電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cd_2330',c:'CD',s:'2330',n:'台積電期',sn:'台積電',fn:'台灣積體電路製造股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:true},
{i:'qf_2330',c:'QF',s:'2330',n:'小型台積電期',sn:'小台積電',fn:'台灣積體電路製造股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:true},
{i:'fv_2331',c:'FV',s:'2331',n:'精英期',sn:'精英',fn:'精英電腦股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fw_2332',c:'FW',s:'2332',n:'友訊期',sn:'友訊',fn:'友訊科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'di_2337',c:'DI',s:'2337',n:'旺宏期',sn:'旺宏',fn:'旺宏電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qv_2338',c:'QV',s:'2338',n:'光罩期',sn:'光罩',fn:'台灣光罩股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fy_2340',c:'FY',s:'2340',n:'台亞期',sn:'台亞',fn:'台亞半導體股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'fz_2344',c:'FZ',s:'2344',n:'華邦電期',sn:'華邦電',fn:'華邦電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'op_2345',c:'OP',s:'2345',n:'智邦期',sn:'智邦',fn:'智邦科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'se_2345',c:'SE',s:'2345',n:'小型智邦期',sn:'小智邦',fn:'智邦科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ga_2347',c:'GA',s:'2347',n:'聯強期',sn:'聯強',fn:'聯強國際股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cw_2352',c:'CW',s:'2352',n:'佳世達期',sn:'佳世達',fn:'佳世達科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ds_2353',c:'DS',s:'2353',n:'宏碁期',sn:'宏碁',fn:'宏碁股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gc_2354',c:'GC',s:'2354',n:'鴻準期',sn:'鴻準',fn:'鴻準精密工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'mb_2355',c:'MB',s:'2355',n:'敬鵬期',sn:'敬鵬',fn:'敬鵬工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lq_2356',c:'LQ',s:'2356',n:'英業達期',sn:'英業達',fn:'英業達股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dj_2357',c:'DJ',s:'2357',n:'華碩期',sn:'華碩',fn:'華碩電腦股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qr_2357',c:'QR',s:'2357',n:'小型華碩期',sn:'小華碩',fn:'華碩電腦股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'mj_2360',c:'MJ',s:'2360',n:'致茂期',sn:'致茂',fn:'致茂電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vd_2360',c:'VD',s:'2360',n:'小型致茂期',sn:'小致茂',fn:'致茂電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'vb_2367',c:'VB',s:'2367',n:'燿華期',sn:'燿華',fn:'燿華電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rk_2368',c:'RK',s:'2368',n:'金像電期',sn:'金像電',fn:'金像電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vg_2368',c:'VG',s:'2368',n:'小型金像電期',sn:'小金像電',fn:'金像電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'cx_2371',c:'CX',s:'2371',n:'大同期',sn:'大同',fn:'大同股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gh_2376',c:'GH',s:'2376',n:'技嘉期',sn:'技嘉',fn:'技嘉科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sl_2376',c:'SL',s:'2376',n:'小型技嘉期',sn:'小技嘉',fn:'技嘉科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'gi_2377',c:'GI',s:'2377',n:'微星期',sn:'微星',fn:'微星科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gj_2379',c:'GJ',s:'2379',n:'瑞昱期',sn:'瑞昱',fn:'瑞昱半導體股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qg_2379',c:'QG',s:'2379',n:'小型瑞昱期',sn:'小瑞昱',fn:'瑞昱半導體股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'dk_2382',c:'DK',s:'2382',n:'廣達期',sn:'廣達',fn:'廣達電腦股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pj_2383',c:'PJ',s:'2383',n:'台光電期',sn:'台光電',fn:'台光電子材料股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sf_2383',c:'SF',s:'2383',n:'小型台光電期',sn:'小台光電',fn:'台光電子材料股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'gk_2385',c:'GK',s:'2385',n:'群光期',sn:'群光',fn:'群光電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qw_2388',c:'QW',s:'2388',n:'威盛期',sn:'威盛',fn:'威盛電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gl_2392',c:'GL',s:'2392',n:'正崴期',sn:'正崴',fn:'正崴精密工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gm_2393',c:'GM',s:'2393',n:'億光期',sn:'億光',fn:'億光電子工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vi_2395',c:'VI',s:'2395',n:'研華期',sn:'研華',fn:'研華股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gn_2401',c:'GN',s:'2401',n:'凌陽期',sn:'凌陽',fn:'凌陽科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'go_2404',c:'GO',s:'2404',n:'漢唐期',sn:'漢唐',fn:'漢唐集成股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uz_2404',c:'UZ',s:'2404',n:'小型漢唐期',sn:'小漢唐',fn:'漢唐集成股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'cy_2408',c:'CY',s:'2408',n:'南亞科期',sn:'南亞科',fn:'南亞科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ch_2409',c:'CH',s:'2409',n:'友達期',sn:'友達',fn:'友達光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dl_2412',c:'DL',s:'2412',n:'中華電期',sn:'中華電',fn:'中華電信股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vc_2421',c:'VC',s:'2421',n:'建準期',sn:'建準',fn:'建準電機工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'mk_2439',c:'MK',s:'2439',n:'美律期',sn:'美律',fn:'美律實業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qt_2441',c:'QT',s:'2441',n:'超豐期',sn:'超豐',fn:'超豐電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gr_2449',c:'GR',s:'2449',n:'京元電子期',sn:'京元電子',fn:'京元電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dv_2454',c:'DV',s:'2454',n:'聯發科期',sn:'聯發科',fn:'聯發科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pu_2454',c:'PU',s:'2454',n:'小型聯發科期',sn:'小聯發科',fn:'聯發科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'gu_2455',c:'GU',s:'2455',n:'全新期',sn:'全新',fn:'全新光電科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gv_2457',c:'GV',s:'2457',n:'飛宏期',sn:'飛宏',fn:'飛宏科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gw_2458',c:'GW',s:'2458',n:'義隆期',sn:'義隆',fn:'義隆電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gx_2474',c:'GX',s:'2474',n:'可成期',sn:'可成',fn:'可成科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gy_2481',c:'GY',s:'2481',n:'強茂期',sn:'強茂',fn:'強茂股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'gz_2485',c:'GZ',s:'2485',n:'兆赫期',sn:'兆赫',fn:'兆赫電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ut_2486',c:'UT',s:'2486',n:'一詮期',sn:'一詮',fn:'一詮精密工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ha_2489',c:'HA',s:'2489',n:'瑞軒期',sn:'瑞軒',fn:'瑞軒科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hb_2492',c:'HB',s:'2492',n:'華新科期',sn:'華新科',fn:'華新科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hc_2498',c:'HC',s:'2498',n:'宏達電期',sn:'宏達電',fn:'宏達國際電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hh_2515',c:'HH',s:'2515',n:'中工期',sn:'中工',fn:'中華工程股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hi_2520',c:'HI',s:'2520',n:'冠德期',sn:'冠德',fn:'冠德建設股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hl_2542',c:'HL',s:'2542',n:'興富發期',sn:'興富發',fn:'興富發建設股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ho_2548',c:'HO',s:'2548',n:'華固期',sn:'華固',fn:'華固建設股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cz_2603',c:'CZ',s:'2603',n:'長榮期',sn:'長榮',fn:'長榮海運股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hq_2605',c:'HQ',s:'2605',n:'新興期',sn:'新興',fn:'新興航運股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qc_2606',c:'QC',s:'2606',n:'裕民期',sn:'裕民',fn:'裕民航運股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'da_2609',c:'DA',s:'2609',n:'陽明期',sn:'陽明',fn:'陽明海運股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'db_2610',c:'DB',s:'2610',n:'華航期',sn:'華航',fn:'中華航空股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qx_2615',c:'QX',s:'2615',n:'萬海期',sn:'萬海',fn:'萬海航運股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'hs_2618',c:'HS',s:'2618',n:'長榮航期',sn:'長榮航',fn:'長榮航空股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pg_2633',c:'PG',s:'2633',n:'台灣高鐵期',sn:'台灣高鐵',fn:'台灣高速鐵路股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rc_2634',c:'RC',s:'2634',n:'漢翔期',sn:'漢翔',fn:'漢翔航空工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dc_2801',c:'DC',s:'2801',n:'彰銀期',sn:'彰銀',fn:'彰化商業銀行股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ia_2834',c:'IA',s:'2834',n:'臺企銀期',sn:'臺企銀',fn:'臺灣中小企業銀行股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cj_2880',c:'CJ',s:'2880',n:'華南金期',sn:'華南金',fn:'華南金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ce_2881',c:'CE',s:'2881',n:'富邦金期',sn:'富邦金',fn:'富邦金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ck_2882',c:'CK',s:'2882',n:'國泰金期',sn:'國泰金',fn:'國泰金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lr_2883',c:'LR',s:'2883',n:'凱基金期',sn:'凱基金',fn:'凱基金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dn_2884',c:'DN',s:'2884',n:'玉山金期',sn:'玉山金',fn:'玉山金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'do_2885',c:'DO',s:'2885',n:'元大金期',sn:'元大金',fn:'元大金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cl_2886',c:'CL',s:'2886',n:'兆豐金期',sn:'兆豐金',fn:'兆豐金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cm_2887',c:'CM',s:'2887',n:'台新新光金期',sn:'台新新光金',fn:'台新新光金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'de_2890',c:'DE',s:'2890',n:'永豐金期',sn:'永豐金',fn:'永豐金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'cn_2891',c:'CN',s:'2891',n:'中信金期',sn:'中信金',fn:'中國信託金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dp_2892',c:'DP',s:'2892',n:'第一金期',sn:'第一金',fn:'第一金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ih_2913',c:'IH',s:'2913',n:'農林期',sn:'農林',fn:'台灣農林股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dw_2915',c:'DW',s:'2915',n:'潤泰全期',sn:'潤泰全',fn:'潤泰全球股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sj_3005',c:'SJ',s:'3005',n:'神基期',sn:'神基',fn:'神基控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ii_3006',c:'II',s:'3006',n:'晶豪科期',sn:'晶豪科',fn:'晶豪科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ij_3008',c:'IJ',s:'3008',n:'大立光期',sn:'大立光',fn:'大立光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ol_3008',c:'OL',s:'3008',n:'小型大立光期',sn:'小大立光',fn:'大立光電股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ra_3017',c:'RA',s:'3017',n:'奇鋐期',sn:'奇鋐',fn:'奇鋐科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uh_3017',c:'UH',s:'3017',n:'小型奇鋐期',sn:'小奇鋐',fn:'奇鋐科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'im_3019',c:'IM',s:'3019',n:'亞光期',sn:'亞光',fn:'亞洲光學股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'io_3034',c:'IO',s:'3034',n:'聯詠期',sn:'聯詠',fn:'聯詠科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qh_3034',c:'QH',s:'3034',n:'小型聯詠期',sn:'小聯詠',fn:'聯詠科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ip_3035',c:'IP',s:'3035',n:'智原期',sn:'智原',fn:'智原科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'iq_3036',c:'IQ',s:'3036',n:'文曄期',sn:'文曄',fn:'文曄科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ir_3037',c:'IR',s:'3037',n:'欣興期',sn:'欣興',fn:'欣興電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'it_3042',c:'IT',s:'3042',n:'晶技期',sn:'晶技',fn:'台灣晶技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lb_3044',c:'LB',s:'3044',n:'健鼎期',sn:'健鼎',fn:'健鼎科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lc_3045',c:'LC',s:'3045',n:'台灣大期',sn:'台灣大',fn:'台灣大哥大股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qq_3078',c:'QQ',s:'3078',n:'僑威期',sn:'僑威',fn:'僑威科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ot_3081',c:'OT',s:'3081',n:'聯亞期',sn:'聯亞',fn:'聯亞光電工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qi_3105',c:'QI',s:'3105',n:'小型穩懋期',sn:'小穩懋',fn:'穩懋半導體股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'nb_3152',c:'NB',s:'3152',n:'璟德期',sn:'璟德',fn:'璟德電子工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ix_3189',c:'IX',s:'3189',n:'景碩期',sn:'景碩',fn:'景碩科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nc_3211',c:'NC',s:'3211',n:'順達期',sn:'順達',fn:'順達科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vj_3211',c:'VJ',s:'3211',n:'小型順達期',sn:'小順達',fn:'順達科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'pa_3227',c:'PA',s:'3227',n:'原相期',sn:'原相',fn:'原相科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'dx_3231',c:'DX',s:'3231',n:'緯創期',sn:'緯創',fn:'緯創資通股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nd_3260',c:'ND',s:'3260',n:'威剛期',sn:'威剛',fn:'威剛科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ne_3264',c:'NE',s:'3264',n:'欣銓期',sn:'欣銓',fn:'欣銓科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'px_3293',c:'PX',s:'3293',n:'鈊象期',sn:'鈊象',fn:'鈊象電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'py_3293',c:'PY',s:'3293',n:'小型鈊象期',sn:'小鈊象',fn:'鈊象電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'pt_3324',c:'PT',s:'3324',n:'雙鴻期',sn:'雙鴻',fn:'雙鴻科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ul_3324',c:'UL',s:'3324',n:'小型雙鴻期',sn:'小雙鴻',fn:'雙鴻科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ql_3374',c:'QL',s:'3374',n:'精材期',sn:'精材',fn:'精材科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'iy_3376',c:'IY',s:'3376',n:'新日興期',sn:'新日興',fn:'新日興股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'iz_3380',c:'IZ',s:'3380',n:'明泰期',sn:'明泰',fn:'明泰科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'le_3406',c:'LE',s:'3406',n:'玉晶光期',sn:'玉晶光',fn:'玉晶光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qj_3406',c:'QJ',s:'3406',n:'小型玉晶光期',sn:'小玉晶光',fn:'玉晶光電股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'jb_3443',c:'JB',s:'3443',n:'創意期',sn:'創意',fn:'創意電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rw_3443',c:'RW',s:'3443',n:'小型創意期',sn:'小創意',fn:'創意電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'dq_3481',c:'DQ',s:'3481',n:'群創期',sn:'群創',fn:'群創光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pi_3529',c:'PI',s:'3529',n:'力旺期',sn:'力旺',fn:'力旺電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rs_3529',c:'RS',s:'3529',n:'小型力旺期',sn:'小力旺',fn:'力旺電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'qd_3532',c:'QD',s:'3532',n:'台勝科期',sn:'台勝科',fn:'台塑勝高科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'jf_3533',c:'JF',s:'3533',n:'嘉澤期',sn:'嘉澤',fn:'嘉澤端子工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rf_3533',c:'RF',s:'3533',n:'小型嘉澤期',sn:'小嘉澤',fn:'嘉澤端子工業股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ou_3552',c:'OU',s:'3552',n:'同致期',sn:'同致',fn:'同致電子企業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'jm_3653',c:'JM',s:'3653',n:'健策期',sn:'健策',fn:'健策精密工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rg_3653',c:'RG',s:'3653',n:'小型健策期',sn:'小健策',fn:'健策精密工業股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'um_3661',c:'UM',s:'3661',n:'世芯-KY期',sn:'世芯-KY',fn:'世芯電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uo_3661',c:'UO',s:'3661',n:'小型世芯-KY期',sn:'小世芯-KY',fn:'世芯電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ve_3665',c:'VE',s:'3665',n:'貿聯-KY期',sn:'貿聯-KY',fn:'貿聯控股',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vf_3665',c:'VF',s:'3665',n:'小型貿聯-KY期',sn:'小貿聯-KY',fn:'貿聯控股',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'jn_3673',c:'JN',s:'3673',n:'TPK-KY期',sn:'TPK-KY',fn:'TPK Holding Co., Ltd.',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sy_3680',c:'SY',s:'3680',n:'家登期',sn:'家登',fn:'家登精密工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sz_3680',c:'SZ',s:'3680',n:'小型家登期',sn:'小家登',fn:'家登精密工業股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ng_3691',c:'NG',s:'3691',n:'碩禾期',sn:'碩禾',fn:'碩禾電子材料股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'jp_3702',c:'JP',s:'3702',n:'大聯大期',sn:'大聯大',fn:'大聯大控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ps_3706',c:'PS',s:'3706',n:'神達期',sn:'神達',fn:'神達控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'oz_3711',c:'OZ',s:'3711',n:'日月光投控期',sn:'日月光投控',fn:'日月光投資控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qb_3714',c:'QB',s:'3714',n:'富采期',sn:'富采',fn:'富采控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ni_4123',c:'NI',s:'4123',n:'晟德期',sn:'晟德',fn:'晟德大藥廠股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rd_4128',c:'RD',s:'4128',n:'中天期',sn:'中天',fn:'中天生物科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pc_4162',c:'PC',s:'4162',n:'智擎期',sn:'智擎',fn:'智擎生技製藥股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pd_4736',c:'PD',s:'4736',n:'泰博期',sn:'泰博',fn:'泰博科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rn_4743',c:'RN',s:'4743',n:'合一期',sn:'合一',fn:'合一生技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lt_4904',c:'LT',s:'4904',n:'遠傳期',sn:'遠傳',fn:'遠傳電信股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'re_4919',c:'RE',s:'4919',n:'新唐期',sn:'新唐',fn:'新唐科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'js_4938',c:'JS',s:'4938',n:'和碩期',sn:'和碩',fn:'和碩聯合科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lu_4958',c:'LU',s:'4958',n:'臻鼎-KY期',sn:'臻鼎-KY',fn:'臻鼎科技控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nj_5009',c:'NJ',s:'5009',n:'榮剛期',sn:'榮剛',fn:'榮剛材料科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ph_5269',c:'PH',s:'5269',n:'祥碩期',sn:'祥碩',fn:'祥碩科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pn_5269',c:'PN',s:'5269',n:'小型祥碩期',sn:'小祥碩',fn:'祥碩科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'pz_5274',c:'PZ',s:'5274',n:'信驊期',sn:'信驊',fn:'信驊科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qa_5274',c:'QA',s:'5274',n:'小型信驊期',sn:'小信驊',fn:'信驊科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'nl_5347',c:'NL',s:'5347',n:'世界期',sn:'世界',fn:'世界先進積體電路股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nm_5371',c:'NM',s:'5371',n:'中光電期',sn:'中光電',fn:'中強光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rb_5388',c:'RB',s:'5388',n:'中磊期',sn:'中磊',fn:'中磊電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pe_5425',c:'PE',s:'5425',n:'台半期',sn:'台半',fn:'台灣半導體股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pp_5457',c:'PP',s:'5457',n:'宣德期',sn:'宣德',fn:'宣德科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'no_5483',c:'NO',s:'5483',n:'中美晶期',sn:'中美晶',fn:'中美矽晶製品股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'jw_5534',c:'JW',s:'5534',n:'長虹期',sn:'長虹',fn:'長虹建設股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lv_5871',c:'LV',s:'5871',n:'中租-KY期',sn:'中租-KY',fn:'中租控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ue_5876',c:'UE',s:'5876',n:'上海商銀期',sn:'上海商銀',fn:'上海商業儲蓄銀行股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lo_5880',c:'LO',s:'5880',n:'合庫金期',sn:'合庫金',fn:'合作金庫金融控股股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rp_5904',c:'RP',s:'5904',n:'寶雅期',sn:'寶雅',fn:'寶雅國際股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rr_5904',c:'RR',s:'5904',n:'小型寶雅期',sn:'小寶雅',fn:'寶雅國際股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'jx_6005',c:'JX',s:'6005',n:'群益證期',sn:'群益證',fn:'群益金鼎證券股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'oe_6116',c:'OE',s:'6116',n:'彩晶期',sn:'彩晶',fn:'瀚宇彩晶股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nq_6121',c:'NQ',s:'6121',n:'新普期',sn:'新普',fn:'新普科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ub_6139',c:'UB',s:'6139',n:'亞翔期',sn:'亞翔',fn:'亞翔工程股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'vk_6139',c:'VK',s:'6139',n:'小型亞翔期',sn:'小亞翔',fn:'亞翔工程股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ns_6147',c:'NS',s:'6147',n:'頎邦期',sn:'頎邦',fn:'頎邦科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'jz_6153',c:'JZ',s:'6153',n:'嘉聯益期',sn:'嘉聯益',fn:'嘉聯益科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pk_6173',c:'PK',s:'6173',n:'信昌電期',sn:'信昌電',fn:'信昌電子陶瓷股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ka_6176',c:'KA',s:'6176',n:'瑞儀期',sn:'瑞儀',fn:'瑞儀光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pl_6182',c:'PL',s:'6182',n:'合晶期',sn:'合晶',fn:'合晶科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uc_6188',c:'UC',s:'6188',n:'廣明期',sn:'廣明',fn:'廣明光電股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'oa_006205',c:'OA',s:'006205',n:'富邦上証ETF期',sn:'富邦上証ETF',fn:'富邦上証180證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'ob_006206',c:'OB',s:'006206',n:'元大上證50ETF期',sn:'元大上證50ETF',fn:'元大中國傘型證券投資信託基金之上證50證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'kb_6213',c:'KB',s:'6213',n:'聯茂期',sn:'聯茂',fn:'聯茂電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uv_6223',c:'UV',s:'6223',n:'旺矽期',sn:'旺矽',fn:'旺矽科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uw_6223',c:'UW',s:'6223',n:'小型旺矽期',sn:'小旺矽',fn:'旺矽科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'kc_6239',c:'KC',s:'6239',n:'力成期',sn:'力成',fn:'力成科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ro_6245',c:'RO',s:'6245',n:'立端期',sn:'立端',fn:'立端科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'mq_6257',c:'MQ',s:'6257',n:'矽格期',sn:'矽格',fn:'矽格股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'li_6269',c:'LI',s:'6269',n:'台郡期',sn:'台郡',fn:'台郡科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'kd_6271',c:'KD',s:'6271',n:'同欣電期',sn:'同欣電',fn:'同欣電子工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ov_6274',c:'OV',s:'6274',n:'台燿期',sn:'台燿',fn:'台燿科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ke_6278',c:'KE',s:'6278',n:'台表科期',sn:'台表科',fn:'台灣表面黏著科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'oh_6279',c:'OH',s:'6279',n:'胡連期',sn:'胡連',fn:'胡連精密股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'kf_6282',c:'KF',s:'6282',n:'康舒期',sn:'康舒',fn:'康舒科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'kg_6285',c:'KG',s:'6285',n:'啟碁期',sn:'啟碁',fn:'啟碁科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uy_6290',c:'UY',s:'6290',n:'良維期',sn:'良維',fn:'良維科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'oq_6414',c:'OQ',s:'6414',n:'樺漢期',sn:'樺漢',fn:'樺漢科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rl_6443',c:'RL',s:'6443',n:'元晶期',sn:'元晶',fn:'元晶太陽能科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'up_6472',c:'UP',s:'6472',n:'保瑞期',sn:'保瑞',fn:'保瑞藥業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uq_6472',c:'UQ',s:'6472',n:'小型保瑞期',sn:'小保瑞',fn:'保瑞藥業股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ow_6488',c:'OW',s:'6488',n:'環球晶期',sn:'環球晶',fn:'環球晶圓股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pb_6488',c:'PB',s:'6488',n:'小型環球晶期',sn:'小環球晶',fn:'環球晶圓股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'uf_6505',c:'UF',s:'6505',n:'台塑化期',sn:'台塑化',fn:'台塑石化股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ox_6510',c:'OX',s:'6510',n:'精測期',sn:'精測',fn:'中華精測科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'oy_6510',c:'OY',s:'6510',n:'小型精測期',sn:'小精測',fn:'中華精測科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'ug_6526',c:'UG',s:'6526',n:'達發期',sn:'達發',fn:'達發科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ui_6526',c:'UI',s:'6526',n:'小型達發期',sn:'小達發',fn:'達發科技股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'qy_6547',c:'QY',s:'6547',n:'高端疫苗期',sn:'高端疫苗',fn:'高端疫苗生物製劑股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pv_6669',c:'PV',s:'6669',n:'緯穎期',sn:'緯穎',fn:'緯穎科技服務股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pw_6669',c:'PW',s:'6669',n:'小型緯穎期',sn:'小緯穎',fn:'緯穎科技服務股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'uu_6757',c:'UU',s:'6757',n:'台灣虎航期',sn:'台灣虎航',fn:'台灣虎航股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qz_6770',c:'QZ',s:'6770',n:'力積電期',sn:'力積電',fn:'力晶積成電子製造股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'rz_00679B',c:'RZ',s:'00679B',n:'元大美債20年ETF期',sn:'元大美債20年ETF',fn:'元大美國政府20年期(以上)債券證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:true},
{i:'uk_00687B',c:'UK',s:'00687B',n:'國泰20年美債ETF期',sn:'國泰20年美債ETF',fn:'國泰20年期(以上)美國公債指數證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'si_00719B',c:'SI',s:'00719B',n:'元大美債1-3ETF期',sn:'元大美債1-3ETF',fn:'元大美國政府1至3年期債券ETF基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'sq_00772B',c:'SQ',s:'00772B',n:'中信高評級公司債ETF期',sn:'中信高評級公司債ETF',fn:'中國信託多元收益債券ETF傘型證券投資信託基金之中國信託10年期以上高評級美元公司債券ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'ki_8039',c:'KI',s:'8039',n:'台虹期',sn:'台虹',fn:'台虹科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nu_8044',c:'NU',s:'8044',n:'網家期',sn:'網家',fn:'網路家庭國際資訊股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ly_8046',c:'LY',s:'8046',n:'南電期',sn:'南電',fn:'南亞電路板股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qs_8046',c:'QS',s:'8046',n:'小型南電期',sn:'小南電',fn:'南亞電路板股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'nv_8069',c:'NV',s:'8069',n:'元太期',sn:'元太',fn:'元太科技工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pr_8086',c:'PR',s:'8086',n:'宏捷科期',sn:'宏捷科',fn:'宏捷科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sk_8112',c:'SK',s:'8112',n:'至上期',sn:'至上',fn:'至上電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qu_8150',c:'QU',s:'8150',n:'南茂期',sn:'南茂',fn:'南茂科技股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'kk_8163',c:'KK',s:'8163',n:'達方期',sn:'達方',fn:'達方電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'nw_8299',c:'NW',s:'8299',n:'群聯期',sn:'群聯',fn:'群聯電子股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'qn_8299',c:'QN',s:'8299',n:'小型群聯期',sn:'小群聯',fn:'群聯電子股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
{i:'pq_8358',c:'PQ',s:'8358',n:'金居期',sn:'金居',fn:'金居開發股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'pm_8436',c:'PM',s:'8436',n:'大江期',sn:'大江',fn:'大江生醫股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'uj_00937B',c:'UJ',s:'00937B',n:'群益ESG投等債20+ETF期',sn:'群益ESG投等債20+ETF',fn:'群益ESG 20年期以上BBB投資等級公司債ETF證券投資信託基金',cat:'etf',tl:'ETF期貨',spl:10000,ns:false},
{i:'kl_9904',c:'KL',s:'9904',n:'寶成期',sn:'寶成',fn:'寶成工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'lm_9914',c:'LM',s:'9914',n:'美利達期',sn:'美利達',fn:'美利達工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'mv_9938',c:'MV',s:'9938',n:'百和期',sn:'百和',fn:'台灣百和工業股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ko_9939',c:'KO',s:'9939',n:'宏全期',sn:'宏全',fn:'宏全國際股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'kp_9945',c:'KP',s:'9945',n:'潤泰新期',sn:'潤泰新',fn:'潤泰創新國際股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'ru_9958',c:'RU',s:'9958',n:'世紀鋼期',sn:'世紀鋼',fn:'世紀鋼鐵結構股份有限公司',cat:'stock',tl:'股票期貨',spl:2000,ns:false},
{i:'sw_9958',c:'SW',s:'9958',n:'小型世紀鋼期',sn:'小世紀鋼',fn:'世紀鋼鐵結構股份有限公司',cat:'small_stock',tl:'小型股票期貨',spl:100,ns:false},
];

const IDX=[
  {i:"tx", c:"TX",s:"TX",n:"大台指",sn:"大台",fn:"台灣加權指數期貨（大台）",cat:"index",tl:"指數期貨",mType:"fixed",mult:200,spl:null,origMg:184000,maintMg:141000,ns:true},
  {i:"mtx",c:"MTX",s:"MTX",n:"小台指",sn:"小台",fn:"台灣加權指數期貨（小台）",cat:"index",tl:"指數期貨",mType:"fixed",mult:50, spl:null,origMg:46000, maintMg:35000, ns:true},
  {i:"tmf",c:"TMF",s:"TMF",n:"微型台指",sn:"微台",fn:"台灣加權指數期貨（微台）",cat:"index",tl:"指數期貨",mType:"fixed",mult:10, spl:null,origMg:18400, maintMg:14200, ns:true},
];
const SP=SD.map(p=>({...p,mType:"dynamic",mult:null,mgRate:0.135}));
const ALL=[...IDX,...SP];
const LVO=[1,1.3,1.5,1.8,2,2.5];
const SCO=[-0.10,-0.08,-0.05,-0.03,+0.03,+0.05,+0.08,+0.10];
const SKEY="futures-calc-state-v2";
const ACC_TYPES={stock:{label:"現股",unit:"張",color:"#4DA8FF"},fund:{label:"基金",unit:"單位",color:"#FFAA44"},overseas:{label:"復委託",unit:"股",color:"#B89EFF"},cash:{label:"現金",unit:"",color:"#3DFFA0"}};

const pN=s=>{const v=parseFloat(String(s||0).replace(/,/g,""));return isNaN(v)?0:v;};
const fN=(n,d=0)=>n==null||isNaN(n)?"—":n.toLocaleString("zh-TW",{maximumFractionDigits:d,minimumFractionDigits:d});
const fM=n=>{if(n==null||isNaN(n))return"—";const a=Math.abs(n),s=n<0?"-":"";if(a>=100000000)return s+(a/100000000).toFixed(2)+"億";if(a>=10000)return s+(a/10000).toFixed(1)+"萬";return fN(n);};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const lv=(p,x)=>!x||x<=0?0:p.cat==="index"?x*p.mult:x*p.spl;
const om=(p,x)=>p.mType==="fixed"?p.origMg:lv(p,x)*p.mgRate;
const cl=(cap,p,x,L)=>{const v=lv(p,x);if(v<=0||cap<=0)return{lots:0,al:0,pv:0,mg:0};const n=Math.floor(cap*L/v);const pv=n*v;return{lots:n,al:pv/cap,pv,mg:om(p,x)*n};};
const MODES={normal:{label:"現股",color:"#4DA8FF"},margin:{label:"融資",color:"#FFAA44"},short:{label:"融券",color:"#FF5566"}};
const accCalc=acc=>{
  if(acc.type==="cash")return{mv:pN(acc.cash),net:pN(acc.cash),exp:0};
  const fx=acc.type==="overseas"?(pN(acc.fx)||1):1;
  let mv=0,net=0,exp=0;
  acc.holdings.forEach(h=>{
    const mult=acc.type==="stock"?((h.unit==="share")?1:1000):1;
    const v=pN(h.qty)*pN(h.price)*mult*fx;
    if(v<=0&&!pN(h.loan))return;
    const loan=pN(h.loan)*fx;
    const mode=acc.type==="stock"?(h.mode||"normal"):"normal";
    if(mode==="normal"){mv+=v;net+=v;exp+=v;}
    else if(mode==="margin"){mv+=v;net+=v-loan;exp+=v;}
    else if(mode==="short"){mv+=v;net+=loan-v;exp+=v;}
  });
  return{mv,net,exp};
};

const C={bg:"#0B1929",card:"rgba(255,255,255,0.05)",br:"rgba(255,255,255,0.10)",blue:"#4DA8FF",green:"#3DFFA0",orange:"#FFAA44",red:"#FF5566",yellow:"#FFD555",purple:"#B89EFF",pink:"#FF79C6",text:"#E6F2FF",muted:"#6E8DAA",dim:"rgba(255,255,255,0.28)"};
const CC={index:C.purple,stock:C.blue,small_stock:C.green,etf:C.orange,small_etf:C.pink};
const LC={1:C.green,1.3:"#6FFFD4",1.5:C.blue,1.8:C.purple,2:C.orange,2.5:C.red};
const bI={width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.11)",borderRadius:8,color:C.text,padding:"10px 12px",fontSize:15,outline:"none"};

const Card=({children,ac,style})=><div style={{background:C.card,border:`1px solid ${ac?ac+"44":C.br}`,borderRadius:14,padding:"16px 18px",marginBottom:14,...style}}>{children}</div>;
const SL=({children,right})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:11,letterSpacing:3,color:C.blue,textTransform:"uppercase",fontWeight:700}}>{children}</span>{right}</div>;
const IR=({label,sub,children})=><div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:5}}><span>{label}</span>{sub&&<span style={{color:C.dim}}>{sub}</span>}</div>{children}</div>;
const Chip=({label,active,onClick,color=C.blue})=><button onClick={onClick} style={{padding:"7px 13px",border:`1.5px solid ${active?color:C.br}`,borderRadius:20,background:active?color+"22":"transparent",color:active?color:C.muted,fontSize:13,fontWeight:active?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>;
const AddBtn=({onClick,label="＋ 新增部位"})=><button onClick={onClick} style={{width:"100%",padding:"10px",background:C.blue+"10",border:`1px dashed ${C.blue}55`,color:C.blue,borderRadius:8,cursor:"pointer",fontSize:13}}>{label}</button>;
const CopyBtn=({text,label="📋 複製"})=>{
  const[ok,sOk]=useState(false);
  return <button onClick={async()=>{try{await navigator.clipboard.writeText(text);sOk(true);setTimeout(()=>sOk(false),1500);}catch(e){}}}
    style={{padding:"5px 12px",background:ok?C.green+"22":"rgba(255,255,255,0.06)",border:`1px solid ${ok?C.green:C.br}`,color:ok?C.green:C.muted,borderRadius:7,cursor:"pointer",fontSize:12}}>
    {ok?"✓ 已複製":label}
  </button>;
};
const DelBtn=({onConfirm,small})=>{
  const[arm,sArm]=useState(false);
  useEffect(()=>{if(arm){const t=setTimeout(()=>sArm(false),2500);return()=>clearTimeout(t);}},[arm]);
  return <button onClick={()=>{if(arm){onConfirm();sArm(false);}else sArm(true);}}
    style={{padding:small?"4px 9px":"7px 12px",background:arm?C.red+"33":C.red+"15",border:`1px solid ${C.red}${arm?"":"44"}`,color:C.red,borderRadius:7,cursor:"pointer",fontSize:small?11:13,whiteSpace:"nowrap"}}>
    {arm?"確認刪除?":"✕"}
  </button>;
};

function ProductSearch({onSelect, exclude=[], placeholder="搜尋：股票代號、名稱或期貨代碼", selected=null, onClear, favs=[], onToggleFav}){
  const[q,sQ]=useState("");const[open,sO]=useState(false);const ref=useRef(null);
  const res=useMemo(()=>{
    if(!q.trim())return[];
    const k=q.trim().toLowerCase();
    return SP.filter(p=>!exclude.includes(p.i)&&(p.s.includes(k)||p.sn.toLowerCase().includes(k)||p.n.toLowerCase().includes(k)||p.c.toLowerCase().includes(k))).slice(0,10);
  },[q,exclude]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))sO(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const selProd = selected ? ALL.find(p=>p.i===selected) : null;
  return(
    <div ref={ref} style={{position:"relative"}}>
      {selProd ? (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"rgba(255,255,255,0.07)",border:`1px solid ${CC[selProd.cat]||C.blue}66`,borderRadius:8}}>
          <span style={{fontWeight:700,color:CC[selProd.cat]||C.blue,flex:1}}>{selProd.sn} <span style={{fontSize:12,fontWeight:400,color:C.muted}}>{selProd.s} · {selProd.tl}</span></span>
          {onClear&&<button onClick={onClear} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>}
        </div>
      ):(
        <div style={{position:"relative"}}>
          <input value={q} onChange={e=>{sQ(e.target.value);sO(true);}} onFocus={()=>sO(true)} placeholder={placeholder} style={{...bI,paddingLeft:36}}/>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14,pointerEvents:"none"}}>🔍</span>
          {q&&<button onClick={()=>{sQ("");sO(false);}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>}
        </div>
      )}
      {!selProd&&open&&res.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#122035",border:`1px solid ${C.br}`,borderRadius:10,zIndex:200,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
          {res.map(p=>(
            <div key={p.i} style={{display:"flex",alignItems:"stretch",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <button onClick={()=>{onSelect(p.i);sQ("");sO(false);}} style={{flex:1,background:"none",border:"none",color:C.text,cursor:"pointer",padding:"11px 6px 11px 14px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontWeight:700,marginRight:6}}>{p.sn}</span><span style={{fontSize:12,color:C.muted}}>{p.s}</span></div>
                <span style={{fontSize:11,color:CC[p.cat]||C.blue,background:(CC[p.cat]||C.blue)+"18",padding:"2px 7px",borderRadius:6}}>{p.tl}</span>
              </button>
              {onToggleFav&&<button onClick={()=>onToggleFav(p.i)} style={{background:"none",border:"none",cursor:"pointer",padding:"0 12px",fontSize:15,color:favs.includes(p.i)?C.yellow:C.dim}}>{favs.includes(p.i)?"★":"☆"}</button>}
            </div>
          ))}
        </div>
      )}
      {!selProd&&open&&q.trim()&&res.length===0&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#122035",border:`1px solid ${C.br}`,borderRadius:10,zIndex:200,padding:"12px 14px",color:C.dim,fontSize:13}}>找不到「{q}」</div>}
    </div>
  );
}

function PRow({pos,onChange,onRemove,priceMem,onPrice}){
  const p=ALL.find(x=>x.i===pos.pid);
  const price=pN(pos.price),lots=parseInt(pos.lots)||0;
  const pv=p&&price>0&&lots>0?lv(p,price)*lots:0,mg=p&&price>0&&lots>0?om(p,price)*lots:0;
  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.br}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{flex:1}}>
          <ProductSearch selected={pos.pid||null}
            onSelect={id=>{const mem=priceMem?.[id];onChange({...pos,pid:id,price:pos.price||(mem??"")});}}
            onClear={()=>onChange({...pos,pid:""})} placeholder="搜尋商品（代號或名稱）"/>
        </div>
        <DelBtn onConfirm={onRemove}/>
      </div>
      {p&&<div style={{fontSize:11,color:C.dim,marginBottom:8}}>{p.fn}｜{p.mType==="fixed"?`每點 ${p.mult} 元`:`每口 ${(p.spl||0).toLocaleString()} 股`}</div>}
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr",gap:8}}>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>方向</div>
          <div style={{display:"flex",gap:4}}>
            {[["L","多"],["S","空"]].map(([v,l])=>(
              <button key={v} onClick={()=>onChange({...pos,dir:v})} style={{padding:"8px 11px",border:"none",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:700,background:(pos.dir||"L")===v?(v==="L"?"linear-gradient(135deg,#1A9E6E,#0D7A52)":"linear-gradient(135deg,#C0392B,#922B21)"):"rgba(255,255,255,0.06)",color:(pos.dir||"L")===v?"#fff":C.muted}}>{l}</button>
            ))}
          </div>
        </div>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>現價</div><input type="number" inputMode="decimal" value={pos.price} onChange={e=>{onChange({...pos,price:e.target.value});if(p&&onPrice)onPrice(p.i,e.target.value);}} placeholder="現價" style={{...bI,padding:"8px 10px",fontSize:13}}/></div>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>口數</div><input type="number" inputMode="numeric" value={pos.lots} onChange={e=>onChange({...pos,lots:e.target.value})} placeholder="口數" style={{...bI,padding:"8px 10px",fontSize:13}}/></div>
      </div>
      {pv>0&&<div style={{marginTop:8,fontSize:12,color:C.muted,display:"flex",gap:14}}><span>部位 {fM(pv)}</span><span>保證金 {fM(mg)}</span></div>}
    </div>
  );
}

// ═══ 口數計算 ═══
function LotCalc({S,U}){
  const cap_=pN(S.cap);
  const selP=ALL.filter(p=>S.lotIds.includes(p.i));
  const addId=id=>U(s=>({...s,lotIds:[...s.lotIds,id],lotPrices:{...s.lotPrices,[id]:s.lotPrices[id]||s.priceMem[id]||""}}));
  const rmId=id=>U(s=>({...s,lotIds:s.lotIds.filter(x=>x!==id)}));
  const togLv=l=>U(s=>({...s,lotLvs:s.lotLvs.includes(l)?s.lotLvs.filter(x=>x!==l):[...s.lotLvs,l].sort((a,b)=>a-b)}));
  const setPrice=(id,v)=>U(s=>({...s,lotPrices:{...s.lotPrices,[id]:v},priceMem:{...s.priceMem,[id]:v}}));
  const togFav=id=>U(s=>({...s,favs:s.favs.includes(id)?s.favs.filter(x=>x!==id):[...s.favs,id]}));
  const res=useMemo(()=>selP.map(p=>{const x=pN(S.lotPrices[p.i]);return{p,x,v:lv(p,x),rows:S.lotLvs.map(L=>({L,...cl(cap_,p,x,L)}))};}),[selP,S.lotPrices,cap_,S.lotLvs]);
  const summary=useMemo(()=>{
    if(!res.length||cap_<=0)return"";
    let t=`【期貨口數試算】資金 ${fM(cap_)}\n`;
    res.forEach(({p,x,rows})=>{if(x<=0)return;t+=`\n■ ${p.n}（${p.s}）現價 ${x}\n`;rows.forEach(({L,lots,al,pv})=>{t+=`  ${L}x → ${lots}口（實際${al.toFixed(2)}x，部位${fM(pv)}）\n`;});});
    return t;
  },[res,cap_]);
  const favProds=SP.filter(p=>S.favs.includes(p.i)&&!S.lotIds.includes(p.i));
  return(
    <div>
      <Card><SL>可用資金</SL><input type="number" inputMode="decimal" value={S.cap} onChange={e=>U(s=>({...s,cap:e.target.value}))} placeholder="例：1,310,000" style={bI}/>{cap_>0&&<div style={{fontSize:13,color:C.muted,marginTop:6}}>≈ {fM(cap_)} 元</div>}</Card>
      <Card>
        <SL>選擇標的</SL>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.purple,fontWeight:600,marginBottom:8}}>指數期貨</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {IDX.map(p=>(
              <button key={p.i} onClick={()=>S.lotIds.includes(p.i)?rmId(p.i):addId(p.i)} style={{padding:"9px 14px",border:`1.5px solid ${S.lotIds.includes(p.i)?C.purple:C.br}`,borderRadius:10,background:S.lotIds.includes(p.i)?C.purple+"22":"transparent",color:S.lotIds.includes(p.i)?C.purple:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",gap:1,textAlign:"left"}}>
                <span style={{fontSize:14,fontWeight:700}}>{p.sn}</span><span style={{fontSize:10,opacity:0.65}}>乘數 {p.mult}</span>
              </button>
            ))}
          </div>
        </div>
        {favProds.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.yellow,fontWeight:600,marginBottom:8}}>★ 常用標的</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {favProds.map(p=>(<button key={p.i} onClick={()=>addId(p.i)} style={{padding:"6px 12px",border:`1.5px solid ${C.yellow}44`,borderRadius:18,background:C.yellow+"0D",color:C.yellow,cursor:"pointer",fontSize:13,fontWeight:600}}>{p.sn} <span style={{fontSize:10,opacity:0.7}}>{p.s}</span></button>))}
            </div>
          </div>
        )}
        <div style={{fontSize:11,color:C.blue,fontWeight:600,marginBottom:8}}>股票 / ETF 期貨搜尋（點 ☆ 加常用）</div>
        <ProductSearch onSelect={addId} exclude={S.lotIds} favs={S.favs} onToggleFav={togFav}/>
        {selP.filter(p=>p.cat!=="index").length>0&&(
          <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:7}}>
            {selP.filter(p=>p.cat!=="index").map(p=>(
              <div key={p.i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:(CC[p.cat]||C.blue)+"18",border:`1px solid ${CC[p.cat]||C.blue}44`,borderRadius:20}}>
                <span style={{fontSize:13,fontWeight:700,color:CC[p.cat]||C.blue}}>{p.sn}</span><span style={{fontSize:11,color:C.dim}}>{p.s}</span>
                <button onClick={()=>rmId(p.i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
              </div>
            ))}
          </div>
        )}
      </Card>
      {selP.length>0&&<Card><SL>輸入現價</SL>{selP.map(p=><IR key={p.i} label={`${p.n}（${p.s||p.c}）`} sub={p.cat==="index"?`每點 ${p.mult} 元`:`每口 ${(p.spl||0).toLocaleString()} 股`}><input type="number" inputMode="decimal" value={S.lotPrices[p.i]||""} onChange={e=>setPrice(p.i,e.target.value)} placeholder="輸入現價" style={bI}/>{S.lotPrices[p.i]&&lv(p,pN(S.lotPrices[p.i]))>0&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>每口：{fM(lv(p,pN(S.lotPrices[p.i])))} 元</div>}</IR>)}</Card>}
      <Card><SL>目標槓桿（可多選）</SL><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{LVO.map(L=><Chip key={L} label={`${L}x`} active={S.lotLvs.includes(L)} onClick={()=>togLv(L)} color={LC[L]}/>)}</div></Card>
      {summary&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><CopyBtn text={summary} label="📋 複製摘要"/></div>}
      {res.map(({p,x,v,rows})=>(
        <Card key={p.i} ac={CC[p.cat]}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div><div style={{fontSize:16,fontWeight:700,color:CC[p.cat]}}>{p.n}</div><div style={{fontSize:11,color:C.muted}}>{p.tl}｜{p.cat==="index"?`乘數 ${p.mult}`:`${(p.spl||0).toLocaleString()} 股/口`}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:14}}>{x>0?fN(x):"—"}</div><div style={{fontSize:11,color:C.muted}}>每口 {v>0?fM(v):"—"}</div></div>
          </div>
          {x>0?(<>
            <div style={{display:"grid",gridTemplateColumns:"48px 52px 1fr 1fr 1fr",gap:4,fontSize:11,color:C.dim,paddingBottom:6,borderBottom:`1px solid ${C.br}`}}><span>槓桿</span><span style={{textAlign:"center"}}>口數</span><span style={{textAlign:"right"}}>實際槓桿</span><span style={{textAlign:"right"}}>部位</span><span style={{textAlign:"right"}}>保證金</span></div>
            {rows.map(({L,lots,al,pv,mg})=>(
              <div key={L} style={{display:"grid",gridTemplateColumns:"48px 52px 1fr 1fr 1fr",gap:4,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:LC[L]||C.text}}>{L}x</span>
                <span style={{textAlign:"center",fontSize:24,fontWeight:800,color:lots>0?(LC[L]||C.text):C.dim}}>{lots>0?lots:"—"}</span>
                <span style={{textAlign:"right",fontSize:13,color:C.muted}}>{al>0?al.toFixed(2)+"x":"—"}</span>
                <span style={{textAlign:"right",fontSize:12}}>{pv>0?fM(pv):"—"}</span>
                <span style={{textAlign:"right",fontSize:12,color:C.muted}}>{mg>0?fM(mg):"—"}</span>
              </div>
            ))}
          </>):(<div style={{color:C.dim,fontSize:13,textAlign:"center",padding:"10px 0"}}>請輸入現價</div>)}
        </Card>
      ))}
    </div>
  );
}

// ═══ 口數反推 ═══
function RevCalc({S,U}){
  const c1_=pN(S.cap),c2_=pN(S.cap2);
  const tp=ALL.find(p=>p.i===S.revTid),tLV=tp?lv(tp,pN(S.revPrice)):0;
  const togLv=l=>U(s=>({...s,revLvs:s.revLvs.includes(l)?s.revLvs.filter(x=>x!==l):[...s.revLvs,l].sort((a,b)=>a-b)}));
  const validPos=S.positions.filter(p=>{const pr=ALL.find(x=>x.i===p.pid);return pr&&pN(p.price)>0&&(parseInt(p.lots)||0)>0;});
  const exT=validPos.reduce((s,p)=>{const pr=ALL.find(x=>x.i===p.pid);return s+lv(pr,pN(p.price))*(parseInt(p.lots)||0);},0);
  const rev=useMemo(()=>{if(!tp||tLV<=0||c1_<=0)return[];return S.revLvs.map(L=>{const rem=c1_*L-exT;const n=Math.max(0,Math.floor(rem/tLV));const tot=exT+n*tLV;return{L,n,rem,tot,al:tot/c1_,l2:c2_>0?tot/c2_:null};});},[tp,tLV,c1_,c2_,exT,S.revLvs]);
  return(<div>
    <Card><SL>資金設定</SL><IR label="現在資金"><input type="number" inputMode="decimal" value={S.cap} onChange={e=>U(s=>({...s,cap:e.target.value}))} placeholder="例：1310000" style={bI}/></IR><IR label="未來資金（選填）"><input type="number" inputMode="decimal" value={S.cap2} onChange={e=>U(s=>({...s,cap2:e.target.value}))} placeholder="例：1710000" style={bI}/></IR></Card>
    <Card><SL>已有部位（自動帶入）</SL>
      {validPos.length===0?<div style={{textAlign:"center",fontSize:12,color:C.dim,padding:"4px 0"}}>無持倉，可至「期貨」分頁輸入</div>:(<>
        {validPos.map(p=>{const pr=ALL.find(x=>x.i===p.pid);return(<div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:6,fontSize:13}}><span style={{fontWeight:600,color:CC[pr.cat]||C.blue}}>{pr.sn} <span style={{fontSize:11,color:(p.dir||"L")==="S"?C.red:C.green}}>{(p.dir||"L")==="S"?"空":"多"}</span></span><span style={{color:C.muted}}>{p.lots}口 @{p.price}｜{fM(lv(pr,pN(p.price))*(parseInt(p.lots)||0))}</span></div>);})}
        <div style={{fontSize:13,color:C.muted,padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:6}}>合計：{fM(exT)} 元</div>
      </>)}
    </Card>
    <Card><SL>欲新增商品</SL>
      <IR label="商品"><ProductSearch selected={S.revTid||null} onSelect={id=>U(s=>({...s,revTid:id,revPrice:s.revPrice||s.priceMem[id]||""}))} onClear={()=>U(s=>({...s,revTid:"",revPrice:""}))} placeholder="搜尋欲新增的商品"/></IR>
      {tp&&<IR label="現價"><input type="number" inputMode="decimal" value={S.revPrice} onChange={e=>U(s=>({...s,revPrice:e.target.value,priceMem:{...s.priceMem,[s.revTid]:e.target.value}}))} placeholder="現價" style={bI}/>{tLV>0&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>每口：{fM(tLV)} 元</div>}</IR>}
      <div style={{fontSize:12,color:C.muted,marginBottom:8}}>目標總槓桿上限</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{LVO.map(L=><Chip key={L} label={`${L}x`} active={S.revLvs.includes(L)} onClick={()=>togLv(L)} color={LC[L]}/>)}</div>
    </Card>
    {rev.length>0&&<Card><SL>反推結果：{tp?.sn}</SL>{rev.map(({L,n,rem,tot,al,l2})=><div key={L} style={{padding:"12px 14px",marginBottom:8,background:LC[L]+"10",border:`1px solid ${LC[L]}33`,borderRadius:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{color:LC[L],fontWeight:700,fontSize:14}}>目標槓桿 {L}x</span><span style={{color:LC[L],fontWeight:800,fontSize:26}}>{n} 口</span></div><div style={{fontSize:12,color:C.muted,display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}><span>可用空間：{fM(Math.max(0,rem))}</span><span>實際總槓桿：{al.toFixed(2)}x</span><span>新增後總部位：{fM(tot)}</span>{l2!=null&&<span style={{color:C.blue}}>未來資金槓桿：{l2.toFixed(2)}x</span>}</div></div>)}</Card>}
  </div>);
}

// ═══ 情境模擬 ═══
function ScCalc({S}){
  const c=pN(S.cap);
  const validPos=S.positions.map(p=>{const pr=ALL.find(x=>x.i===p.pid);const x=pN(p.price),n=parseInt(p.lots)||0;if(!pr||x<=0||n<=0)return null;return{pr,x,n,dir:p.dir||"L"};}).filter(Boolean);
  const res=useMemo(()=>{if(!validPos.length||c<=0)return[];return SCO.map(sc=>{let tPnl=0,nTP=0,nTM=0;validPos.forEach(({pr,x,n,dir})=>{const nx=x*(1+sc);const sign=dir==="S"?-1:1;tPnl+=(nx-x)*(pr.cat==="index"?pr.mult:pr.spl)*n*sign;nTP+=lv(pr,nx)*n;nTM+=om(pr,nx)*n;});const nC=c+tPnl,nLv=nC>0?nTP/nC:0,ri=nC>0&&nTM>0?nC/nTM*100:0;return{sc,tPnl,nC,nLv,ri};});},[validPos,c]);
  return(<div>
    <Card><SL>持倉（自動帶入「期貨」分頁）</SL>
      {validPos.length===0?<div style={{textAlign:"center",fontSize:12,color:C.dim,padding:"4px 0"}}>無持倉</div>:
        validPos.map(({pr,x,n,dir},i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:6,fontSize:13}}><span style={{fontWeight:600,color:CC[pr.cat]||C.blue}}>{pr.sn} <span style={{fontSize:11,color:dir==="S"?C.red:C.green}}>{dir==="S"?"空":"多"}</span></span><span style={{color:C.muted}}>{n}口 @{x}</span></div>))}
    </Card>
    {res.length>0&&<Card><SL>漲跌情境模擬</SL>
      <div style={{display:"grid",gridTemplateColumns:"52px 1fr 1fr 58px 56px",gap:4,fontSize:10,color:C.dim,paddingBottom:6,borderBottom:`1px solid ${C.br}`}}><span>漲跌</span><span style={{textAlign:"right"}}>損益</span><span style={{textAlign:"right"}}>新權益</span><span style={{textAlign:"right"}}>槓桿</span><span style={{textAlign:"right"}}>風險</span></div>
      {res.map(({sc,tPnl,nC,nLv,ri})=>{const up=sc>0;const pc=up?C.green:Math.abs(sc)>=0.08?C.red:Math.abs(sc)>=0.05?C.orange:C.yellow;const rc2=ri>=150?C.green:ri>=100?C.yellow:ri>=76?C.orange:C.red;return(<div key={sc} style={{display:"grid",gridTemplateColumns:"52px 1fr 1fr 58px 56px",gap:4,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",alignItems:"center",fontSize:13}}><span style={{fontWeight:700,color:pc}}>{up?"+":""}{(sc*100).toFixed(0)}%</span><span style={{textAlign:"right",fontWeight:700,color:pc}}>{tPnl>=0?"+":""}{fM(tPnl)}</span><span style={{textAlign:"right"}}>{fM(nC)}</span><span style={{textAlign:"right",color:nLv>2.5?C.red:nLv>2?C.orange:C.text}}>{nLv>0?nLv.toFixed(2)+"x":"—"}</span><span style={{textAlign:"right",color:rc2}}>{ri>0?fN(ri,0)+"%":"—"}</span></div>);})}
    </Card>}
  </div>);
}

// ═══ 計算分頁（含3個子功能）═══
function CalcTab({S,U}){
  const[sub,sSub]=useState("lot");
  const subs=[{id:"lot",label:"口數計算"},{id:"rev",label:"口數反推"},{id:"sc",label:"情境模擬"}];
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:16,background:"rgba(255,255,255,0.04)",borderRadius:11,padding:4}}>
      {subs.map(t=><button key={t.id} onClick={()=>sSub(t.id)} style={{flex:1,padding:"9px 0",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,background:sub===t.id?"linear-gradient(135deg,#2D7DD2,#1A5AA0)":"transparent",color:sub===t.id?"#fff":C.muted}}>{t.label}</button>)}
    </div>
    {sub==="lot"&&<LotCalc S={S} U={U}/>}
    {sub==="rev"&&<RevCalc S={S} U={U}/>}
    {sub==="sc"&&<ScCalc S={S}/>}
  </div>);
}

// ═══ 期貨部位 ═══
function FutTab({S,U}){
  const c=pN(S.cap);
  const setPos=fn=>U(s=>({...s,positions:fn(s.positions)}));
  const onPrice=(id,v)=>U(s=>({...s,priceMem:{...s.priceMem,[id]:v}}));
  const comp=useMemo(()=>{let tP=0,tM=0;S.positions.forEach(p=>{const pr=ALL.find(x=>x.i===p.pid);const x=pN(p.price),n=parseInt(p.lots)||0;if(!pr||x<=0||n<=0)return;tP+=lv(pr,x)*n;tM+=om(pr,x)*n;});return{tP,tM,tL:c>0&&tP>0?tP/c:0,ri:c>0&&tM>0?c/tM*100:0};},[S.positions,c]);
  const rc=comp.ri<=0?C.muted:comp.ri>=150?C.green:comp.ri>=100?C.yellow:comp.ri>=76?C.orange:C.red;
  return(<div>
    <Card><SL>期貨帳戶權益數</SL><input type="number" inputMode="decimal" value={S.cap} onChange={e=>U(s=>({...s,cap:e.target.value}))} placeholder="例：1310000" style={bI}/>{c>0&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>≈ {fM(c)} 元</div>}</Card>
    <Card><SL>期貨持倉（自動儲存）</SL>
      {S.positions.map(p=><PRow key={p.id} pos={p} priceMem={S.priceMem} onPrice={onPrice} onChange={np=>setPos(prev=>prev.map(x=>x.id===p.id?np:x))} onRemove={()=>setPos(prev=>prev.filter(x=>x.id!==p.id))}/>)}
      <AddBtn onClick={()=>U(s=>({...s,positions:[...s.positions,{id:s.nid,pid:"",price:"",lots:"",dir:"L"}],nid:s.nid+1}))}/>
    </Card>
    {comp.tP>0&&c>0&&<Card ac={rc}>
      <SL>期貨部位分析</SL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[{label:"期貨部位",val:fM(comp.tP),color:C.text},{label:"期貨槓桿",val:comp.tL.toFixed(2)+"x",color:comp.tL>2?C.orange:C.green},{label:"保證金",val:fM(comp.tM),color:C.text},{label:"風險指標",val:fN(comp.ri,0)+"%",sub:comp.ri>=150?"✓ 安全":comp.ri>=100?"⚠ 注意":comp.ri>=76?"⚠ 追繳":"❗ 危險",color:rc}].map(({label,val,sub,color})=><div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{label}</div><div style={{fontSize:18,fontWeight:700,color}}>{val}</div>{sub&&<div style={{fontSize:10,color,marginTop:2}}>{sub}</div>}</div>)}</div>
    </Card>}
  </div>);
}

// ═══ 資產總覽 ═══
function AssetTab({S,U}){
  const futEq=pN(S.cap);
  const futPos=S.positions.reduce((s,p)=>{const pr=ALL.find(x=>x.i===p.pid);const x=pN(p.price),n=parseInt(p.lots)||0;if(!pr||x<=0||n<=0)return s;return s+lv(pr,x)*n;},0);
  const futMg=S.positions.reduce((s,p)=>{const pr=ALL.find(x=>x.i===p.pid);const x=pN(p.price),n=parseInt(p.lots)||0;if(!pr||x<=0||n<=0)return s;return s+om(pr,x)*n;},0);
  const accVals=S.accounts.map(a=>({...a,val:accVal(a)}));
  const secVal=accVals.filter(a=>a.type!=="cash").reduce((s,a)=>s+a.val,0);
  const cashVal=accVals.filter(a=>a.type==="cash").reduce((s,a)=>s+a.val,0);
  const totalAssets=futEq+secVal+cashVal;
  const totalPos=futPos+secVal;
  const totalLev=totalAssets>0?totalPos/totalAssets:0;
  const futRi=futEq>0&&futMg>0?futEq/futMg*100:0;

  const updAcc=(id,fn)=>U(s=>({...s,accounts:s.accounts.map(a=>a.id===id?fn(a):a)}));
  const addHolding=id=>updAcc(id,a=>({...a,holdings:[...a.holdings,{id:Date.now(),name:"",qty:"",price:""}]}));
  const addAccount=type=>U(s=>({...s,accounts:[...s.accounts,{id:"acc"+Date.now(),name:ACC_TYPES[type].label+(s.accounts.filter(a=>a.type===type).length+1),type,fx:type==="overseas"?"31.5":"1",cash:"",holdings:[]}]}));

  const settle=useMemo(()=>{
    let t=`【每日結算表】${today()}\n`;
    t+=`────────────\n`;
    t+=`期貨權益　 ${fM(futEq)}\n`;
    accVals.forEach(a=>{if(a.calc.net!==0||a.calc.mv>0)t+=`${a.name}　 淨值${fM(a.calc.net)}${a.calc.mv!==a.calc.net?`（市值${fM(a.calc.mv)}）`:""}\n`;});
    t+=`────────────\n`;
    t+=`總淨資產　 ${fM(totalAssets)}\n`;
    t+=`期貨部位　 ${fM(futPos)}\n`;
    t+=`證券曝險　 ${fM(secExp)}\n`;
    t+=`總部位　　 ${fM(totalPos)}\n`;
    t+=`總槓桿　　 ${totalLev.toFixed(2)}x\n`;
    if(futRi>0)t+=`期貨風險指標 ${fN(futRi,0)}%\n`;
    return t;
  },[futEq,accVals,totalAssets,futPos,secExp,totalPos,totalLev,futRi]);

  const saveSnapshot=()=>{
    const snap={date:today(),totalAssets,totalPos,lev:totalLev,futEq,secNet,secExp,cashVal,futPos,futRi};
    U(s=>{
      const others=s.snapshots.filter(x=>x.date!==snap.date);
      return{...s,snapshots:[...others,snap].sort((a,b)=>a.date.localeCompare(b.date))};
    });
  };
  const savedToday=S.snapshots.some(x=>x.date===today());

  return(<div>
    {/* 總覽卡 */}
    <Card ac={C.green} style={{background:"linear-gradient(135deg,rgba(61,255,160,0.07),rgba(77,168,255,0.05))"}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>總淨資產</div>
      <div style={{fontSize:32,fontWeight:800,color:C.green,letterSpacing:-1}}>{fM(totalAssets)}</div>
      <div style={{display:"flex",gap:18,marginTop:10,fontSize:13}}>
        <span style={{color:C.muted}}>總部位 <b style={{color:C.text}}>{fM(totalPos)}</b></span>
        <span style={{color:C.muted}}>總槓桿 <b style={{color:totalLev>2?C.orange:totalLev>1.5?C.yellow:C.green}}>{totalLev.toFixed(2)}x</b></span>
      </div>
    </Card>

    {/* 期貨帳戶 */}
    <Card ac={C.purple}>
      <SL>期貨帳戶</SL>
      <IR label="權益數（與期貨分頁同步）"><input type="number" inputMode="decimal" value={S.cap} onChange={e=>U(s=>({...s,cap:e.target.value}))} placeholder="期貨帳戶權益" style={bI}/></IR>
      <div style={{fontSize:12,color:C.muted,display:"flex",gap:16}}><span>期貨部位 {fM(futPos)}</span>{futRi>0&&<span>風險指標 {fN(futRi,0)}%</span>}</div>
    </Card>

    {/* 各帳戶 */}
    {accVals.map(a=>{
      const at=ACC_TYPES[a.type];
      return(
        <Card key={a.id} ac={at.color}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
            <input value={a.name} onChange={e=>updAcc(a.id,x=>({...x,name:e.target.value}))} style={{...bI,padding:"6px 10px",fontSize:14,fontWeight:700,flex:1,background:"transparent",border:"1px solid transparent"}}/>
            <span style={{fontSize:11,color:at.color,background:at.color+"18",padding:"3px 9px",borderRadius:6,whiteSpace:"nowrap"}}>{at.label}</span>
            <DelBtn small onConfirm={()=>U(s=>({...s,accounts:s.accounts.filter(x=>x.id!==a.id)}))}/>
          </div>
          {a.type==="cash"?(
            <input type="number" inputMode="decimal" value={a.cash} onChange={e=>updAcc(a.id,x=>({...x,cash:e.target.value}))} placeholder="現金金額" style={bI}/>
          ):(
            <>
              {a.type==="overseas"&&<IR label="匯率（外幣→台幣）"><input type="number" inputMode="decimal" value={a.fx} onChange={e=>updAcc(a.id,x=>({...x,fx:e.target.value}))} placeholder="31.5" style={{...bI,maxWidth:120,padding:"7px 10px",fontSize:13}}/></IR>}
              {a.holdings.map(h=>{
                const updH=patch=>updAcc(a.id,x=>({...x,holdings:x.holdings.map(y=>y.id===h.id?{...y,...patch}:y)}));
                const mode=a.type==="stock"?(h.mode||"normal"):"normal";
                const unit=h.unit||"lot";
                const hMult=a.type==="stock"?(unit==="share"?1:1000):1;
                const hVal=pN(h.qty)*pN(h.price)*hMult;
                return(
                <div key={h.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,padding:"10px 11px",marginBottom:8}}>
                  <div style={{display:"flex",gap:6,marginBottom:7,alignItems:"center"}}>
                    <input value={h.name} onChange={e=>updH({name:e.target.value})} placeholder="標的名稱" style={{...bI,padding:"7px 9px",fontSize:13,flex:1}}/>
                    {a.type==="stock"&&(
                      <select value={mode} onChange={e=>updH({mode:e.target.value})} style={{...bI,padding:"7px 8px",fontSize:12,width:"auto",color:MODES[mode].color,fontWeight:700}}>
                        {Object.entries(MODES).map(([k,v])=><option key={k} value={k} style={{background:"#0B1929",color:"#E6F2FF"}}>{v.label}</option>)}
                      </select>
                    )}
                    <DelBtn small onConfirm={()=>updAcc(a.id,x=>({...x,holdings:x.holdings.filter(y=>y.id!==h.id)}))}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:a.type==="stock"?"auto 1fr 1fr":"1fr 1fr",gap:6}}>
                    {a.type==="stock"&&(
                      <div style={{display:"flex",gap:3,alignItems:"flex-end"}}>
                        {[["lot","張"],["share","股"]].map(([v,l])=>(
                          <button key={v} onClick={()=>updH({unit:v})} style={{padding:"8px 10px",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,background:unit===v?"rgba(77,168,255,0.25)":"rgba(255,255,255,0.05)",color:unit===v?C.blue:C.dim}}>{l}</button>
                        ))}
                      </div>
                    )}
                    <input type="number" inputMode="decimal" value={h.qty} onChange={e=>updH({qty:e.target.value})} placeholder={a.type==="stock"?(unit==="share"?"股數":"張數"):at.unit} style={{...bI,padding:"8px 9px",fontSize:13}}/>
                    <input type="number" inputMode="decimal" value={h.price} onChange={e=>updH({price:e.target.value})} placeholder={a.type==="fund"?"淨值":"現價"} style={{...bI,padding:"8px 9px",fontSize:13}}/>
                  </div>
                  {mode==="margin"&&(
                    <div style={{marginTop:7}}>
                      <input type="number" inputMode="decimal" value={h.loan||""} onChange={e=>updH({loan:e.target.value})} placeholder="融資金額（向券商借款）" style={{...bI,padding:"8px 9px",fontSize:13,borderColor:"rgba(255,170,68,0.3)"}}/>
                      {hVal>0&&pN(h.loan)>0&&<div style={{fontSize:11,color:C.orange,marginTop:4}}>市值 {fM(hVal)} − 融資 {fM(pN(h.loan))} = 淨值 {fM(hVal-pN(h.loan))}（自有資金槓桿 {(hVal/(hVal-pN(h.loan))).toFixed(2)}x）</div>}
                    </div>
                  )}
                  {mode==="short"&&(
                    <div style={{marginTop:7}}>
                      <input type="number" inputMode="decimal" value={h.loan||""} onChange={e=>updH({loan:e.target.value})} placeholder="擔保價款＋保證金（帳上總額）" style={{...bI,padding:"8px 9px",fontSize:13,borderColor:"rgba(255,85,102,0.3)"}}/>
                      {hVal>0&&pN(h.loan)>0&&<div style={{fontSize:11,color:C.red,marginTop:4}}>擔保總額 {fM(pN(h.loan))} − 回補市值 {fM(hVal)} = 淨值 {fM(pN(h.loan)-hVal)}</div>}
                    </div>
                  )}
                  {mode==="normal"&&hVal>0&&<div style={{fontSize:11,color:C.dim,marginTop:6,textAlign:"right"}}>市值 {fM(hVal)}</div>}
                </div>
              );})}
              <AddBtn label={`＋ 新增${at.label}`} onClick={()=>addHolding(a.id)}/>
            </>
          )}
          {(a.calc.mv>0||a.calc.net!==0)&&(
            <div style={{marginTop:10,fontSize:13,textAlign:"right",color:at.color,fontWeight:700}}>
              淨值 {fM(a.calc.net)}{a.calc.mv!==a.calc.net&&<span style={{fontSize:11,fontWeight:400,color:C.muted}}>　市值 {fM(a.calc.mv)}</span>}
            </div>
          )}
        </Card>
      );
    })}

    {/* 新增帳戶 */}
    <Card>
      <SL>新增帳戶</SL>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {Object.entries(ACC_TYPES).map(([k,v])=>(
          <button key={k} onClick={()=>addAccount(k)} style={{padding:"8px 14px",border:`1.5px solid ${v.color}44`,borderRadius:10,background:v.color+"0D",color:v.color,cursor:"pointer",fontSize:13,fontWeight:600}}>＋ {v.label}</button>
        ))}
      </div>
    </Card>

    {/* 結算表 */}
    <Card ac={C.green}>
      <SL right={<CopyBtn text={settle} label="📋 複製結算表"/>}>每日結算表（{today()}）</SL>
      {[
        {label:"期貨帳戶權益",val:futEq,c:C.purple},
        ...accVals.filter(a=>a.calc.net!==0||a.calc.mv>0).map(a=>({label:a.name,val:a.calc.net,c:ACC_TYPES[a.type].color})),
      ].map(({label,val,c:cc})=>(
        <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:14}}>
          <span style={{color:cc}}>{label}</span><span style={{fontWeight:600}}>{fM(val)}</span>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 4px",fontSize:15,fontWeight:800}}>
        <span style={{color:C.green}}>總淨資產</span><span style={{color:C.green}}>{fM(totalAssets)}</span>
      </div>
      <div style={{marginTop:10,padding:"10px 12px",background:"rgba(0,0,0,0.2)",borderRadius:8,fontSize:13,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <span style={{color:C.muted}}>期貨部位 <b style={{color:C.text}}>{fM(futPos)}</b></span>
        <span style={{color:C.muted}}>證券曝險 <b style={{color:C.text}}>{fM(secExp)}</b></span>
        <span style={{color:C.muted}}>總部位 <b style={{color:C.text}}>{fM(totalPos)}</b></span>
        <span style={{color:C.muted}}>總槓桿 <b style={{color:totalLev>2?C.orange:C.green}}>{totalLev.toFixed(2)}x</b></span>
      </div>
      <button onClick={saveSnapshot} style={{width:"100%",marginTop:12,padding:"13px",background:savedToday?"rgba(61,255,160,0.12)":"linear-gradient(135deg,#1A9E6E,#0D7A52)",border:savedToday?`1px solid ${C.green}44`:"none",color:savedToday?C.green:"#fff",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700}}>
        {savedToday?"✓ 今日已記錄（再按可更新）":"📸 儲存今日快照"}
      </button>
    </Card>
  </div>);
}

// ═══ 趨勢 ═══
function TrendChart({snaps}){
  if(snaps.length<2)return<div style={{textAlign:"center",padding:"30px 0",color:C.dim,fontSize:13}}>至少需要 2 筆快照才能畫趨勢圖<br/>每天到「資產」分頁按一次「儲存今日快照」</div>;
  const W=360,H=190,P={t:18,b:26,l:8,r:8};
  const vals=snaps.map(s=>s.totalAssets);
  const mn=Math.min(...vals),mx=Math.max(...vals);
  const rng=mx-mn||1;
  const xs=i=>P.l+(W-P.l-P.r)*(snaps.length===1?0.5:i/(snaps.length-1));
  const ys=v=>P.t+(H-P.t-P.b)*(1-(v-mn)/rng);
  const pts=snaps.map((s,i)=>`${xs(i)},${ys(s.totalAssets)}`).join(" ");
  const area=`${P.l},${H-P.b} ${pts} ${xs(snaps.length-1)},${H-P.b}`;
  const first=snaps[0],last=snaps[snaps.length-1];
  const chg=last.totalAssets-first.totalAssets;
  const chgPct=first.totalAssets>0?chg/first.totalAssets*100:0;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
        <div><div style={{fontSize:24,fontWeight:800,color:C.green}}>{fM(last.totalAssets)}</div><div style={{fontSize:11,color:C.muted}}>{last.date}</div></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:15,fontWeight:700,color:chg>=0?C.green:C.red}}>{chg>=0?"+":""}{fM(chg)}</div>
          <div style={{fontSize:11,color:chg>=0?C.green:C.red}}>{chgPct>=0?"+":""}{chgPct.toFixed(1)}%（{snaps.length}筆）</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block"}}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3DFFA0" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#3DFFA0" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#ag)"/>
        <polyline points={pts} fill="none" stroke="#3DFFA0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {snaps.map((s,i)=>(<circle key={i} cx={xs(i)} cy={ys(s.totalAssets)} r={i===snaps.length-1?4:2.5} fill={i===snaps.length-1?"#3DFFA0":"#1A9E6E"}/>))}
        <text x={P.l} y={H-8} fill="rgba(255,255,255,0.35)" fontSize="9">{first.date.slice(5)}</text>
        <text x={W-P.r} y={H-8} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">{last.date.slice(5)}</text>
        <text x={P.l} y={ys(mx)-5} fill="rgba(61,255,160,0.5)" fontSize="9">{fM(mx)}</text>
        <text x={P.l} y={ys(mn)+11} fill="rgba(255,255,255,0.3)" fontSize="9">{fM(mn)}</text>
      </svg>
    </div>
  );
}

function TrendTab({S,U}){
  const snaps=S.snapshots;
  const csv=useMemo(()=>{
    let t="日期,總淨資產,總部位,總槓桿,期貨權益,證券淨值,證券曝險,現金,期貨風險指標\n";
    snaps.forEach(s=>{t+=`${s.date},${Math.round(s.totalAssets)},${Math.round(s.totalPos)},${s.lev.toFixed(2)},${Math.round(s.futEq)},${Math.round(s.secNet??s.secVal??0)},${Math.round(s.secExp??s.secVal??0)},${Math.round(s.cashVal||0)},${s.futRi?Math.round(s.futRi):""}\n`;});
    return t;
  },[snaps]);
  return(<div>
    <Card ac={C.green}><SL>淨資產趨勢</SL><TrendChart snaps={snaps}/></Card>
    {snaps.length>0&&(
      <Card>
        <SL right={<CopyBtn text={csv} label="📋 匯出CSV"/>}>歷史快照（{snaps.length}筆）</SL>
        {[...snaps].reverse().map(s=>(
          <div key={s.date} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>{s.date}</div>
              <div style={{fontSize:11,color:C.muted}}>部位 {fM(s.totalPos)}｜槓桿 {s.lev.toFixed(2)}x{s.futRi>0?`｜風險 ${fN(s.futRi,0)}%`:""}</div>
            </div>
            <div style={{fontSize:15,fontWeight:700,color:C.green}}>{fM(s.totalAssets)}</div>
            <DelBtn small onConfirm={()=>U(st=>({...st,snapshots:st.snapshots.filter(x=>x.date!==s.date)}))}/>
          </div>
        ))}
      </Card>
    )}
  </div>);
}

// ═══ 小記 ═══
function NoteTab({S,U}){
  const[draft,sDraft]=useState("");
  const add=()=>{
    if(!draft.trim())return;
    const d=new Date();
    const ts=`${today()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    U(s=>({...s,notes:[{id:Date.now(),ts,text:draft.trim()},...s.notes]}));
    sDraft("");
  };
  return(<div>
    <Card>
      <SL>新增投資小記</SL>
      <textarea value={draft} onChange={e=>sDraft(e.target.value)} placeholder="記錄想法、進出場理由、檢討…" rows={4}
        style={{...bI,resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}/>
      <button onClick={add} disabled={!draft.trim()} style={{width:"100%",marginTop:10,padding:"12px",background:draft.trim()?"linear-gradient(135deg,#2D7DD2,#1A5AA0)":"rgba(255,255,255,0.05)",border:"none",color:draft.trim()?"#fff":C.dim,borderRadius:9,cursor:draft.trim()?"pointer":"default",fontSize:14,fontWeight:700}}>＋ 新增小記</button>
    </Card>
    {S.notes.length>0&&(
      <Card>
        <SL>歷史小記（{S.notes.length}則）</SL>
        {S.notes.map(n=>(
          <div key={n.id} style={{padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <span style={{fontSize:11,color:C.blue}}>{n.ts}</span>
              <DelBtn small onConfirm={()=>U(s=>({...s,notes:s.notes.filter(x=>x.id!==n.id)}))}/>
            </div>
            <div style={{fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{n.text}</div>
          </div>
        ))}
      </Card>
    )}
    {S.notes.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:C.dim,fontSize:13}}>尚無小記</div>}
  </div>);
}

const TABS=[{id:"calc",label:"計算",icon:"🧮"},{id:"fut",label:"期貨",icon:"📊"},{id:"asset",label:"資產",icon:"💼"},{id:"trend",label:"趨勢",icon:"📈"},{id:"note",label:"小記",icon:"📝"}];

const INIT={
  cap:"",cap2:"",lotIds:[],lotPrices:{},lotLvs:[1,1.5,2],
  positions:[{id:1,pid:"",price:"",lots:"",dir:"L"}],nid:2,
  revTid:"",revPrice:"",revLvs:[1.5,2],favs:[],priceMem:{},
  accounts:[
    {id:"a1",name:"券商A 現股",type:"stock",fx:"1",cash:"",holdings:[]},
    {id:"a2",name:"券商B 現股",type:"stock",fx:"1",cash:"",holdings:[]},
    {id:"a3",name:"基金",type:"fund",fx:"1",cash:"",holdings:[]},
    {id:"a4",name:"復委託",type:"overseas",fx:"31.5",cash:"",holdings:[]},
  ],
  snapshots:[],notes:[],
};

export default function App(){
  const[tab,sT]=useState("asset");
  const[S,setS]=useState(INIT);
  const[loaded,sLoaded]=useState(false);
  const saveTimer=useRef(null);

  useEffect(()=>{
    (async()=>{
      try{
        const r=await window.storage.get(SKEY);
        if(r&&r.value){const saved=JSON.parse(r.value);setS({...INIT,...saved});}
      }catch(e){
        // 嘗試讀舊版資料遷移
        try{
          const old=await window.storage.get("futures-calc-state-v1");
          if(old&&old.value){const saved=JSON.parse(old.value);setS({...INIT,...saved});}
        }catch(e2){}
      }
      sLoaded(true);
    })();
  },[]);

  const U=useCallback(fn=>{
    setS(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      if(saveTimer.current)clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(async()=>{
        try{await window.storage.set(SKEY,JSON.stringify(next));}catch(e){}
      },800);
      return next;
    });
  },[]);

  if(!loaded)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"sans-serif"}}>載入中…</div>;

  return(<div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Segoe UI','PingFang TC','Noto Sans TC',sans-serif"}}>
    <div style={{background:"rgba(11,25,41,0.97)",borderBottom:`1px solid ${C.br}`,padding:"11px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
      <span style={{fontSize:20}}>📈</span>
      <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800}}>投資部位管理</div><div style={{fontSize:10,color:C.muted}}>期貨 · 現股 · 基金 · 復委託｜資料自動儲存</div></div>
    </div>
    <div style={{padding:"16px 14px 110px",maxWidth:540,margin:"0 auto"}}>
      {tab==="calc"&&<CalcTab S={S} U={U}/>}
      {tab==="fut"&&<FutTab S={S} U={U}/>}
      {tab==="asset"&&<AssetTab S={S} U={U}/>}
      {tab==="trend"&&<TrendTab S={S} U={U}/>}
      {tab==="note"&&<NoteTab S={S} U={U}/>}
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(11,25,41,0.97)",borderTop:`1px solid ${C.br}`,display:"flex",backdropFilter:"blur(16px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {TABS.map(t=><button key={t.id} onClick={()=>sT(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"8px 2px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===t.id?C.blue:C.muted}}><span style={{fontSize:tab===t.id?21:18}}>{t.icon}</span><span style={{fontSize:10,fontWeight:tab===t.id?700:400}}>{t.label}</span></button>)}
    </div>
  </div>);
}
