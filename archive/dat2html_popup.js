var pop = new Object;
var _NN67,_OP678; // NN67=Netscape6,7,8 OP678=Opera 6,7,8

onload=init;

function init()
{
 // 各オプションの設定
 pop.opt = new Object;
 pop.opt.idpopup = 1;             // 1:ID抽出機能を使用する
 pop.opt.mailpopup = 1;           // 1:メール欄ポップアップを使用する
 pop.opt.refpopup = 1;            // 1:被参照レスポップアップを使用する
 pop.opt.respopup = 1;            // 1:レスポップアップを使用する
 pop.opt.opa = 1;                 // 1:ポップアップウィンドウを半透明化する
 pop.opt.schpanel = 1;            // 1:検索パネルを有効にする
 pop.opt.refskin30 = 0;           // 1:skin30-xと同じ位置で被参照ポップアップを行う
 // 各変数の設定
 pop.max=15;                      // ポップアップレイヤーの限界数(0~99)
 pop.lev=0;                       // ポップアップの深さ(0~pop_max)
 pop.lay= new Array(pop.max);     // ポップアップレイヤーの要素
 pop.ids = new Array;             // IDを記憶するための配列
 pop.refs = new Array;            // レスアンカーの関係を記憶するための配列
 pop.res = new Array;             // レイヤー毎のIDまたはレスの指定先を記憶する文字列配列
 pop.dir = new Object;            // ポップアップの出現方向(x,y)
 pop.flg = new Object;            // ポップアップ制御用
 pop.flg.cnt = 0;                 // 要素から離れた場合のポップアップ制御
 pop.flg.mout = 0;                // どのポップアップのレイヤーから離れたかを記憶
 pop.flg.touch = 0;               // どのポップアップのレイヤーに触れたかを記憶
 pop.timer = new Object;          // タイマー制御用 
 pop.pnl_y = 16;                  // 検索パネルのy座標
 _NN67=navigator.userAgent.match(/Netscape.[67]/);
 _OP678=navigator.userAgent.match(/Opera.[678]/);
 // イベントの設定
 document.onmouseover = event_mouseover;
 document.onmouseout = event_mouseout;
 if (pop.opt.idpopup+pop.opt.refpopup!=0) document.onmousedown = event_click;
 if (pop.opt.schpanel==1) {
  grep3(0,"ini");
  grep3(0,"resize");
  if (document.all && !window.opera) document.onmousemove = new Function("grep3(0,'move')");
 }
 event_resize();
 window.onresize = event_resize;
 // 要素の作成
 var i,s;
 for (i=0;i<=pop.max;i++) {
  pop.lay[i] = document.createElement("div");
  if (i<10) sl="0"+String(i); else sl=String(i);
  // ポップアップウィンドウのデザインを指定
  pop.lay[i].id="sty"+sl;
  pop.lay[i].style.top             = "0px";
  pop.lay[i].style.position        = "absolute";
  pop.lay[i].style.fontSize        = document.body.style.fontSize;    // フォントサイズ
  pop.lay[i].style.border          = "1px solid gray";                // 枠
  pop.lay[i].style.padding         = "6px";                           // 枠と文字との間隔
  pop.lay[i].style.color           = "#000000";                       // 文字色
  pop.lay[i].style.backgroundColor = "#f5fffa";                       // 背景色
  pop.lay[i].style.visibility      = "hidden";
  document.body.appendChild(pop.lay[i]);
 }
  // すべてのaタグの属性値を加工
  if (document.getElementById("html401")!=null) {
  var ss = new Array;
   var spn,bh;
  s=document.getElementsByTagName("A");
  for (i=0;i<s.length;i++) ss[i]=s[i];
  for (i=0;i<s.length;i++) {
   try { if (!ss[i].getAttribute("href")) continue; } catch(e) { continue; }
   if (ss[i].className=="blank") ss[i].target="_blank"; // 別窓で開く
   if (ss[i].className=="mail") {
     bh=window.location.href.replace(/\/[^/]+$/,"")+'/';
    bh=ss[i].href.replace(bh,"");
    if (bh=="sage") ss[i].style.color="#660099"; // メール欄着色
    ss[i].href="mailto:"+bh;
   }
  }
 }

}

function event_click(e) // 画面クリックの処理
{
 var s,spn;
 if (document.all) {
  // 左クリック以外には反応しない
  s=window.event.srcElement;
  if (!window.opera && event.button!=1) return;
  try { spn=(s.tagName=="A" && s.href==null); } catch(e) { return; } // IEのURLエンコードに関するエラー回避
 }
 else {
  if (e.button!=0) return;
  s=e.target;
 }
 if (s==null) return;
 pop.tags=s.tagName;
 for (;;) {
  var rect=get_cursor(e); // 現在位置の取得
  var resnum,ar=new Array;
  if (s.tagName!='DT' && s.tagName!='A' && !(s.tagName=='DIV' && s.id.substr(5,1)=='a')) return;
  if (s.tagName=='A' && !s.getAttribute("href") && s.name!="") {
   resnum=parseInt(s.name.match(/[0-9]{1,5}$/));
   ar[2]=rect[0]-parseInt(document.body.offsetLeft);
   if (resnum==null) break;
  }
  else {
   ar=check_dtpos(s,rect[0]);
   resnum=ar[1];
   if (ar[0]==0) return;
   if (ar[0]==1) break;
  }
  // 被参照レスポップアップ
  if (pop.opt.refpopup==0) break;
  var ref=findrefres(resnum);
  if (ref==null) pophtml="(この投稿に対するレスはありません)";
  else {
   control_multiplepopup(s); // 多重ポップアップ制御
   // ポップアップHTMLの内容の編集
   var pophtml=edit_popuphtml(ref);
   if (pophtml=="") return;
  }
  // レス番号を記憶する
  pop.res[pop.lev+1]=String(resnum);
  // レイヤーの表示
  pop.lev++;
  show_popup(pophtml,ar[2],rect[1],4+(ref==null)*7);
  return;
 }
 for (;;) {
  if (pop.opt.idpopup==0) break;
  if (s.tagName!='DT' && (s.tagName!='DIV' || s.id.substr(5,1)!='a')) break;
  // 日付欄クリックでIDポップアップの処理を行う
  if (pop.lev==pop.max) break; // pop.max個目のポップアップは無し
  var ida=findid(s);
  if (ida[0]==null || ida[0].match(/^\?\?\?/)) return; // 任意IDは除外する
  // 他のレイヤーとIDを比較する
  var c=0,i=1;
  for (;i<=pop.lev;i++) { if (ida[0]==pop.res[i]) c++; }
  if (c>=2) return; // 同じIDは3度ポップアップしない
  control_multiplepopup(s); // 多重ポップアップ制御
  // ポップアップHTMLの内容の編集
  var pophtml="";
  if (ida[1].indexOf(" ")==-1)
   pophtml="(他に同じIDの投稿はありません)";
  else
   pophtml=edit_popuphtml(ida[1]);
  pop.res[pop.lev+1]=ida[0]; // IDを記憶する
  // レイヤーの表示
  pop.lev++;
  show_popup(pophtml,rect[0],rect[1],(pophtml.substr(0,1)=='(')*8+2);
  return;
 }
}

function event_mouseover(e,p1) // マウスがオブジェクトの上を通過した時の処理
{
 var s,spn;
 if (document.all) {
  if (p1=='panel1') s=e; else s=window.event.srcElement;
  try { spn=(s.tagName=="A" && s.href==null); } catch(e) { return; } // IEのエラー回避
 }
 else s=e.target;
 if (s.parentElement) spn=s.parentElement; else spn=s.parentNode;
 for (;;) {
  if (s.id=='panel1' || p1=='panel1') {
   s.firstChild.style.display="block";
   s.style.height=s.firstChild.style.height;
  }
  if (s.id.substr(0,3)=='sty' || s.id.substr(0,3)=='pop') {
   lay_mouseover(s);
   break;
  }
  if (s.tagName!='A' && s.tagName!='B') break;
  var ss;
  if (s.tagName=='A') ss=s; else ss=spn;
  if (ss==null || !ss.getAttribute("href") || pop.opt.mailpopup==0) break;
  // メール欄のポップアップ
  if (ss.href.substr(0,7)!="mailto:") break;
  if (ss.href.indexOf("%",0)!=-1)
   ss.setAttribute("title",decodeURI(ss.href.replace(/^mailto:/,"")));
  else
   ss.setAttribute("title",ss.href.replace(/^mailto:/,""));
  return;
 }
 for (;;) {
  if (s.tagName!='A' || pop.lev==pop.max || pop.opt.respopup==0) break; // pop.max個目のポップアップは無し
  // レスアンカーのポップアップ
  // レスアンカーの始点と終点の判別
  if (spn.tagName=="SPAN" || spn.tagName=="BODY") break; // 「最新50」などのヘッダーとフッターのリンクには反応しない
  pop.tags=s.tagName;
  var anc=get_resnumfroma(s); // リンク文字列から指定レスの範囲を取得
  if (anc==null) break;
  control_multiplepopup(spn); // 多重ポップアップ制御
  // 同じ内容は3度ポップアップしない
  var c=0,i=1,lv,sa="";
  for (i=0,pop.res[pop.lev+1]="";i<anc.length;i++) pop.res[pop.lev+1]+=anc[i]+" ";
  for (lv=1;lv<=pop.lev;lv++) {
   if (pop.res[pop.lev+1]==pop.res[lv]) c++;
  }
  if (c>=2) return;
  // ポップアップHTMLの内容の編集
  for (i=0;i<anc.length && i<25;i++) sa+=anc[i]+" "; // 26レス以降は省略する
  var pophtml=edit_popuphtml(sa);
  if (pophtml=="") return;
  // 現在位置の取得
  var rect=get_cursor(e);
  // レイヤーの表示
  pop.lev++;
  show_popup(pophtml,rect[0],rect[1],1);
  return;
  }
}

function event_mouseout(e) // マウスがオブジェクトの上を離れた時の処理
{
 var s;
 if (document.all) s=window.event.srcElement; else s=e.target;
 if (pop.lev==0) return;
 // ポップアップした後にポップアップ元の要素から離れるとタイマーを設置してフラグを立てる
 // 750ミリ秒の間にポップアップのレイヤーに触らない場合はポップアップを消去する
 if (pop.flg.cnt>1 && s.tagName==pop.tags) {
  if (pop.lay[pop.lev].style.visibility!="visible") return;
  pop.flg.cnt=1;
  pop.flg.mout=pop.lev;
  pop.flg.touch=0;
  if (pop.timer.i!=null) clearTimeout(pop.timer.i);
  pop.timer.i=setTimeout("event_timer()",750);
 }
 if (s.id.substr(0,3)=='sty' || s.id.substr(0,3)=='pop') {
  lay_mouseout(s);
 }
}

function event_timer() // タイマー関連の処理
{
 if (pop.timer.i!=null) pop.flg.cnt=0;
 pop.timer.t=null , pop.timer.i=null;
 // レイヤーから離れて他のレイヤーに触っていない場合は全て消去し、
 // x番目のレイヤーに触っている場合はx+1番目以降のレイヤーを消去する
 if (pop.flg.mout==pop.flg.touch) return;
 var v;
 if (pop.flg.touch==0) v=1; else v=pop.flg.touch+1;
 hide_popup(v);
 pop.lev=(v-1)*(pop.lev>0);
}

function event_resize() // ウィンドウのサイズが変更された場合の処理
{
 if (document.all && !window.opera) {
  document.all.tags("DL")[0].style.cssText="width:"+String(screen.width-40)+"px";
  document.all.tags("DT")[0].style.cssText="width:"+String(screen.width-40)+"px";
 }
 if (pop.opt.schpanel==1) grep3(0,"resize");
}

function lay_mouseover(e) // マウスがポップアップのレイヤー上を通過した時の処理
{
 var c=parseInt(e.id.substr(3,2),10);
 pop.flg.touch=c;
 if (pop.flg.cnt==1 && pop.flg.mout<=c) {
  // ポップアップしてアンカーを離れた後に一定時間以内に
  // ポップアップしたレイヤーに触れたのでポップアップ消去を取り消す
  pop.flg.cnt = 0;
  if (pop.timer.i!=null) clearTimeout(pop.timer.i);
  pop.timer.i=null;
 }
}

function lay_mouseout(e) // マウスがポップアップのレイヤー上を離れた時の処理
{
 // タイマーをセットして250ミリ秒後に消去する
 // 既に高次レイヤーでポップアップ消去フラグが立っている場合はそのままにする
 if (!(pop.timer.t!=null && pop.flg.mout>parseInt(e.id.substr(3,2),10))) pop.flg.mout=parseInt(e.id.substr(3,2),10);
 pop.flg.touch=0;
 if (pop.timer.t!=null) clearTimeout(pop.timer.t);
 pop.timer.t=setTimeout("event_timer()",250);
}

function get_resnumfroma(s) // a要素からレスアンカーが指定した投稿のすべてを配列で返す
{
 if (s==null) return;
 for (;;) {
  try { var spn=(s.tagName=="A" && s.href==null); } catch(e) { return; } // IEのエラー回避
  if (s.href.match(/\/[0-9]{9,10}\/[0-9]{1,5}$/)) break; // read.cgi
  if (s.href.match(/#.{0,3}[0-9]{1,5}$/)) break; // dat2html
  return null;
 }
 var lstr=mbdtosbd(s.innerHTML).replace(/&gt;|\>/g,"").replace(/[\+\,]/g," "); // 全角数字を半角数字に、参照記号を除く
 if (lstr.match(/[^0-9\s\-]/)) return null; // 数字と範囲を示す記号以外が含まれる場合は無効とする
 if (lstr.indexOf("-")==-1) {
  return lstr.split(" ");
 }
 // 範囲を示す記号が含まれている場合
 var lsa=lstr.split(" "),i,j;
 for (i=0,lstr="";lsa[i]!=null;i++) {
  if (lsa[i].indexOf("-")==-1) {
   lstr+=lsa[i]+" ";
   continue;
  }
  var sp,ep;
  sp=parseInt(lsa[i].match(/^[0-9]+/));
  ep=parseInt(lsa[i].match(/[0-9]+$/));
  if (isNaN(ep)) ep=sp+24; // 終点の指定が無い場合
  if (ep-sp>998) ep=sp+999;
  for (j=sp;j<=ep;j++) lstr+=String(j)+" ";
 }
 return lstr.split(" ");
}

function get_resnumfromdt(s) // 指定したdt要素からレス番号を得る
{
 if (s.firstChild && s.firstChild.name!=null)
  return parseInt(s.firstChild.name.match(/[0-9]+/),10); // aタグのname要素を取得 (dat2html)
 else
  return parseInt(s.innerHTML.substr(0,5).match(/[0-9]+/),10); // レス番号を取得 (read.cgi)
}

function get_anchor(num) // 指定したレス番の投稿のdt要素を得る
{
 var l,v,d=0,res,s;
 if (num<1) return null; // 不正なレス番指定
 l=document.getElementsByTagName('DT').length;
 if (l==0) return null; // DT要素が無い
 l<num-1 ? v=l-1 : v=num-1;
 for (;v>=0 && v<l;v+=d) {
  s=document.getElementsByTagName('DT')[v]; // v+1番目のdt要素を取得
  res=get_resnumfromdt(s);
  if (res==num) return s;
  if ((res>num && d==1) || (res<num && d==-1)) break; // 目的のレス番が無い
  res>num ? d=-1 : d=1; // 分割、削除などの理由で目的のレス番が一回で見つからなかった場合は見つかるまで繰り返す
 }
 return null;
}

function get_cursor(e) // 現在の位置を得る
{
 var a=new Array;
 if (document.all)
  a[0]=parseInt(event.x),a[1]=parseInt(event.y);
 else
  a[0]=parseInt(e.clientX),a[1]=parseInt(e.clientY);
 return a;
}

function control_multiplepopup(s) // 多重ポップアップ制御
{
 if (pop.lev==0 || s==null) return null;
 var v,poplv;
 if (s.id.substr(0,3)=="pop")
  poplv=parseInt(s.id.substr(3,2),10);
 else  {
  var spn;
  if (s.parentElement) spn=s.parentElement; else spn=s.parentNode;
  if (spn.id.substr(0,3)=="pop") poplv=parseInt(spn.id.substr(3,2),10); else poplv=0;
 }
 if (pop.lev==1 && poplv==0) v=pop.lev+1; // ポップアップを二股にしない
 if (pop.lev!=poplv) v=poplv+1; //  ポップアップを二股にしない(最後に表示したレイヤー以外からのアンカーによるポップアップの場合)
 if (v==null) return null;
 hide_popup(v);
 pop.lev=(pop.lev-1)*(pop.lev>0);
 return 1;
}

function edit_popuphtml(strnumarray) // ポップアップする投稿を編集する
{
 if (strnumarray=="") return;
 var numarray=strnumarray.split(" ");
 var i,idstr,popstr="",tnode;
 if (pop.lev+1<10) idstr="0"+String(pop.lev+1); else idstr=String(pop.lev+1);
 var bt="0px";
 if (document.getElementsByTagName("dd")[0].className.match(/^mg/)) bt="16px";
 for (i=0;numarray[i]!=null;i++) {
  tnode=get_anchor(parseInt(numarray[i])); // 指定先のレス番号の要素を取得する
  if (tnode==null) continue; // 指定先のレスが無い場合
  popstr+='<div id="pop'+idstr+'a" onmouseover="lay_mouseover(this)" onmouseout="lay_mouseout(this)">'+tnode.innerHTML+"<\/div>";
  popstr+='<div id="pop'+idstr+'b" style="margin:0px 0px '+bt+' 28px;" onmouseover="lay_mouseover(this)" onmouseout="lay_mouseout(this)">';
  popstr+=tnode.nextSibling.innerHTML+"<\/div>"; // tnode.nextSibling=<dd>を指す
 }
 return popstr;
}

function show_popup(d,ex,ey,popupkind) // ポップアップの表示 popupkind=1:レスアンカー 2:ID 4:被参照 10,11:メッセージ
{
 var x,y;
 var dbst=parseInt(Math.max(document.documentElement.scrollTop,document.body.scrollTop));
 var dbch=parseInt(Math.min(document.documentElement.clientHeight,document.body.clientHeight));
 var dbsl=parseInt(document.body.scrollLeft);
 var dbcw=parseInt(document.body.clientWidth);
 dbch+=(dbch==0)*document.body.clientHeight;
 if (window.innerHeight) dbch=window.innerHeight; // Netscape,Safari
 if (window.innerWidth) dbcw=window.innerWidth; 
 var ll=pop.lay[pop.lev];
 // ポップアップ制御フラグの初期化
 if (pop.timer.t!=null) clearTimeout(pop.timer.t);
 if (pop.timer.i!=null) clearTimeout(pop.timer.i);
 pop.timer.t=null , pop.timer.i=null;
 ll.innerHTML=d; // 本文の代入 
 // 位置修正
 if (popupkind==2) {
  // IDポップアップのクリック位置修正(同じレイヤーのレスポップアップの位置を基準にして位置を修正する)
  pop.lev==1 ? ex=dbsl+70 : ex=parseInt(pop.lay[pop.lev-1].style.left,10)-dbsl+54;
  pop.lev==1 ? ey=ey+29   : ey=parseInt(pop.lay[pop.lev-1].style.top,10)-dbst+32;
 }
 ex+=12; // レスアンカーが見えるように修正
 // y軸の設定
 var llch,llcw;
 if (_NN67)
  llch=ll.offsetHeight,llcw=ll.offsetWidth;
 else
  llch=ll.clientHeight,llcw=ll.clientWidth;
 if (pop.lev==1 || pop.dir.y==0) ey>dbch/2 ? pop.dir.y=-1 : pop.dir.y=1;
 if (popupkind==4 || popupkind==11) {
  pop.dir.y=1; // 被参照レスポップアップは常に下方向
  ey+=6;
 }
 popupkind==10 ? ey+=6*pop.dir.y : ey=ey;
 if (pop.dir.y<0) {
  if (pop.lev>1 && ey-llch<0) pop.dir.y=0;
  ey-llch<0 ? y=dbst : y=dbst+ey-llch; // 上
 }
 else {
  if (pop.lev>1 && ey+llch>dbch) pop.dir.y=0;
  ey+llch>dbch ? y=dbst+dbch-llch-2 : y=dbst+ey; // 下
 }
 if (y<1) y=1;
 // x軸の設定
 if (pop.lev==1 || pop.dir.x==0) pop.dir.x=1;
 if (pop.dir.x>0) {
  if (pop.lev>1 && llcw>dbcw-ex) pop.dir.x=-1;
  ex+llcw>dbcw ? x=dbcw-llcw-3 : x=ex; // 右
 }
 else {
  if (pop.lev>1 && ex-llcw<0) pop.dir.x=1;
  ex-llcw<0 ? x=0 : x=ex-llcw; // 左
 }
 if (x<1) x=1;
 // 高さの設定
 var a=0;
 for (;;) {
  if (ll.style.overflow==null) break;
  if (_NN67) {
   ll.style.overflow="auto"; break;
  }
  // 縦はみ出し判定
  if (ll.offsetHeight>=dbch) a=1,y=dbst;
  if (ll.style.overflowY && !_NN67) ll.style.overflowY="visible"; else ll.style.overflow="visible";
  if (a==0) break;
  var llowIE=ll.offsetWidth;
  // ポップアップがウィンドウからはみ出る場合はスクロールバーを追加する 
  ll.style.height=String(dbch)+"px";
  if (window.opera) {
   ll.style.overflow="auto";
   // opera7,8はoverflow="auto"が効かない
   if (_OP678) ll.style.overflow="visible";
   break;
  }
  if (ll.style.overflowY==null) {
   ll.style.overflow="scroll"; break;
  }
  ll.style.overflowY="scroll";
  if (document.all && !window.opera) ll.style.pixelWidth=llowIE+22; // IE横幅調整
  break;
 }
 if (pop.opt.opa==1) {
  if (document.body.style.opacity!=null)
   ll.style.opacity = "0.95";
  else
   ll.style.filter="Alpha(opacity=95)";
 }
  ll.style.left=String(x)+"px";
 ll.style.top=String(y)+"px";
 ll.style.visibility="visible"; // ここで表示
 pophideflag=0;
 // popupkind 1:レス 2:ID 3:メッセージ 4:被参照
 pop.flg.cnt=(popupkind==2)*3+(popupkind==1)*2+(popupkind==4)*4;
 if (pop.flg.cnt==0) hide_popup(pop.lev,"delay"); // すぐに消すメッセージの処理
}

function hide_popup(l,d) // ポップアップの消去
{
 if (d=="delay")  {// ポップアップを遅れて消す
  pop.flg.touch=l-1;
  pop.flg.mout=pop.lev;
  if (pop.timer.t!=null) clearTimeout(pop.timer.t);
  pop.timer.t=setTimeout("event_timer()",700);
  return;
 }
 for (i=pop.max;i>=l;i-=1) {
  if (pop.lay[i].style.visibility=="hidden") continue;
  if (pop.lay[i].style.overflow!=null) pop.lay[i].style.overflowX="";
  pop.lay[i].innerHTML="";
  pop.lay[i].style.overflow="";
  pop.lay[i].style.overflowX="";
  pop.lay[i].style.overflowY="";
  pop.lay[i].style.width="";
  pop.lay[i].style.height="";
  pop.lay[i].style.visibility="hidden";
 }
 return;
}

function check_dtpos(s,ex) // 日付欄のイベントの起きた位置を確認する
{
 pop.lay[0].innerHTML="<dl><dt>"+s.innerHTML+"<\/dt><dd>_<\/dd><\/dl>";
 var lx,v;
 if (pop.lay[0].clientWidth) v=pop.lay[0].clientWidth; else v=pop.lay[0].offsetWidth;
 pop.lay[0].innerHTML="";
 if (pop.lev==0) lx=parseInt(document.body.offsetLeft);
 else {
  var sl;
  if (pop.lev<10) sl="0"+String(pop.lev); else sl=String(pop.lev);
  lx=parseInt(document.getElementById("sty"+sl).style.left);
 }
 var ar=new Array;  // ar[0]:ポップアップの種類 ar[1]:レス番号 ar[2]:ポップアップの位置
 ar[0]=0;
 if (ex>=50+lx && ex<=v+lx) ar[0]=1; // IDポップアップ
 if (ex<50+lx || (ex>v+lx && pop.opt.refskin30==1))　ar[0]=2; // 被参照レスポップアップ
 // レス番号取得
 if (s.firstChild!=null && s.firstChild.name!=null)
  ar[1]=parseInt(s.firstChild.name.match(/[0-9]{1,5}$/));
 else
  ar[1]=parseInt(s.innerHTML.match(/^[0-9]{1,5}/));
 ar[2]=lx+16;
 return ar;
}

function mbdtosbd(s) // 数字と一部記号の全角文字を半角文字に変換する
{
 var mbd=new String("０１２３４５６７８９＋－，＞");
 var sbd=new String("0123456789+-,>");
 var d=new String,c,p;
 for (p=0;p<s.length;p++) {
  c=mbd.indexOf(s.substr(p,1),0);
  if (c!=-1) d+=sbd.charAt(c); else d+=s.charAt(p);
 }
 return d;
}

function findrefres(res) // レスアンカー同士の関係を取得する
{
 if (pop.refs[0]!="done") {
  // すべてのレスアンカー同士の関係を取得する
  var s=new Array,t=new Array;
  var r,lim,ss;
  lim=document.getElementsByTagName("DD").length;
  if (lim<1) return;
  for (r=0;r<lim;r++) {
   t[r]=document.getElementsByTagName("DT")[r];
  }
  for (r=0;r<lim;r++) {
   s[r]=document.getElementsByTagName("DD")[r].firstChild;
  }
  var prv,num,c,v;
  for (r=0;r<lim;r++) {
   for (ss=s[r];ss!=null;ss=ss.nextSibling) {
    if (ss.tagName!="A") continue;
    var anc=get_resnumfroma(ss);
    if (anc==null) continue;
    for (c=0;anc[c]!=null && c<lim;c++) {
     num=get_resnumfromdt(t[r]);
     v=parseInt(anc[c]);
     if (v>=num) continue; // 未来に対するレス指定は無視
     if (pop.refs[v]==null)
      pop.refs[v]=String(num);
     else {
      if (pop.refs[v].indexOf(String(num))!=-1) continue; // 同じレス番に対するレスアンカーは複数登録しない
      pop.refs[v]+=" "+String(num);
     }
    }
   }
  }
  pop.refs[0]="done";
 }
 var retval;
 if (pop.refs[res]=="") retval=null; else retval=pop.refs[res];
 return retval;
}

function findid(s) // 日付欄クリックでIDを取得する
{
 var retval=new Array(2);
 var ss;
 if (pop.ids['idget']!="done") {
  // 全ての投稿のIDを取得する
  var idstr;
  var sa=new Array;
  var i,l,num;
  l=document.getElementsByTagName("DT").length;
  if (l<1) return;
  for (i=0;i<l;i++) {
   sa[i]=document.getElementsByTagName("DT")[i];
  }
  for (i=0;i<l;i++) {
   ss=sa[i].innerHTML.match(/ID:([0-9A-Za-z\/\+\.\_]+)/);
   num=get_resnumfromdt(sa[i]);
   (ss==null) ? idstr="" : idstr=ss[1];
   if (idstr=="") continue;
   if (pop.ids[idstr]==null)
    pop.ids[idstr]=String(num);
   else
    pop.ids[idstr]+=" "+String(num);
  }
  pop.ids['idget']="done";
 }
 ss=s.innerHTML.match(/ID:([0-9A-Za-z\/\+\.\_]+)/);
 (ss==null) ? retval[0]="" : retval[0]=ss[1];
 retval[1]=pop.ids[retval[0]]; // retval[0]と同一のIDの集合を得る
 if (retval[0]==null || retval[1]==null) retval[0]=null,retval[1]=null;
 return retval;
}

function grep3(evt,kind) // スレッド内検索 kind: ini=フォームの作成,move=フォームの移動(固定),resize=ウィンドウのサイズが変更,srh=検索ボタン,not=NGボタン
{
 var spn;
 if (kind=="ini") {
  spn=document.createElement("span");
  document.body.appendChild(spn);
 }
 else spn=document.getElementById("panel1");
 if (kind=="move") {
  // 検索フォームの固定と接触判別(IE専用)
  if (event.x>parseInt(spn.style.left) && event.y<parseInt(spn.style.top)-parseInt(document.documentElement.scrollTop || document.body.scrollTop)+16+spn.offsetHeight) {
   event_mouseover(spn,"panel1");
   document.onmousemove="";
  }
  return;
 }
 if (kind=="ini" || kind=="resize") {
  // 検索パネルの認識位置と大きさの調整
  var dbow=parseInt(document.body.offsetWidth);
  var sh=parseInt(screen.height);
  var w=364; // 幅
  var x=dbow-parseInt(w)+(document.all==null)*34-22; // 左
  var h=96;  // 高さ
  spn.style.left=x+"px";
  spn.style.width=w*(parseInt(w)>0)+"px";
  spn.style.height=h+"px";
  if (kind=="resize") return; // リサイズのみ
  // フォームの初期化作業
  var frm="<form style=[text-align:right; height:10px; display:none;] onsubmit=[return false;] style=[height:5em;]>"+
    "<select name=[combo1] id=[selform] style=[width:7em;]>"+
    "<option value=[contents]>本文<option value=[postinfo]>投稿者情報<\/select>"+
    "<input type=[text] id=[srhtxt] name=[pattern] onkeypress=[grep3(event,'srh')] style=[width:7em;]>"+
    "<input type=[button] value=[検索] onclick=[grep3(0,'srh')] style=[width:3em;]>&thinsp;"+
    "<input type=[button] value=[ＮＧ] onclick=[grep3(0,'not')] style=[width:3em;]>&nbsp;<\/form>";
  spn.id="panel1";
  spn.innerHTML=frm.replace(/(\[|\])/g,"\"");
  if (document.all && !window.opera) {
   spn.style.cssText="position:expression('absolute');"+
    "top:expression((documentElement.scrollTop || document.body.scrollTop)+pop.pnl_y+'px');left:"+x+";"
  }
  else {
   spn.style.position="fixed";
   spn.style.top=pop.pnl_y+"px";
  }
  return;
 }
 // スレッドの絞り込み
 var pattern=document.getElementById("srhtxt").value;
 if (evt!=0) {
  // テキストにカーソルがある場合のEnterキー検出
  if (document.all) k=window.event.keyCode; else k=evt.keyCode;
  if (k!=0x0D && k!=0x0A) return;
 }
 try
 {
  regex = new RegExp(pattern, "i");
  var dts = new Array , dds = new Array, exs = new Array , hide = new Array;
  var cnt=0;
  var l=document.getElementsByTagName('DT').length;
  if (document.body.innerText) {
   for (i=0;i<l;i++) {
    dts[i]=document.getElementsByTagName('DT')[i].innerText.replace(/\r/g,"");
   }
   for (i=0;i<l;i++) {
    dds[i]=document.getElementsByTagName('DT')[i].nextSibling.innerText.replace(/\r/g,"");
   }
  }
  else {
   for (i=0;i<l;i++) {
    dts[i]=document.getElementsByTagName('DT')[i].innerHTML.replace(/<br>/gi,"\n").replace(/<[^>]*>/gi,"");
   }
   for (i=0;i<l;i++) {
    dds[i]=document.getElementsByTagName('DT')[i].nextSibling.innerHTML.replace(/<br>/gi,"\n").replace(/<[^>]*>/gi,"");
   }
  }
  for (i=0;i<l;i++) {
   exs[i]=document.getElementsByTagName('DT')[i];
  }
  spos=0,cnt=0,spn=null;
  w=document.getElementById("selform").selectedIndex; // コンボボックスから検索対象を取得
  for (i=0;i<l;i++) {
   get_resnumfromdt(exs[i]);
   // 検索対象は投稿者情報 or 本文
   spn=(w==0 && dds[i].match(regex))+(w==1 && dts[i].match(regex));
   spos=(spn && (cnt++==0))*i;
   hide[i]=(!spn && kind=="srh")+(spn && kind=="not");
  }
  // 検索ボタンを押下した場合は該当しない投稿を隠し、NGボタンの場合は該当する投稿を隠す
  for (i=0;i<l;i++) {
  dts[i]=document.getElementsByTagName('DT')[i];
  }
  for (i=0;i<l;i++) {
   if (hide[i]!=1) spn=""; else spn="none";
   dts[i].style.display = spn;
  }
  for (i=0;i<l;i++) {
  dds[i]=document.getElementsByTagName('DT')[i].nextSibling;
  }
  for (i=0;i<l;i++) {
   if (hide[i]!=1) spn=""; else spn="none";
   dds[i].style.display = spn;
  }
  window.scrollTo(0,get_anchor(spos+1).offsetTop);
  window.status="※ "+cnt+" / "+l+" 件の検索結果"
 }
 catch (e)
 {
  window.status="※ 正規表現で構文エラーが発生しました";
 }
}

