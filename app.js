'use strict';
const $=id=>document.getElementById(id);
const icon=(id,cls='icon')=>`<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=[
 {id:'eat',name:'食べる',photo:'cat-eat.jpg'}, {id:'sight',name:'観光',photo:'cat-sight.jpg'},
 {id:'shop',name:'買う',photo:'cat-shop.jpg'}, {id:'stay',name:'泊まる',photo:'cat-stay.jpg'},
 {id:'onsen',name:'温泉',photo:'cat-onsen.jpg'}, {id:'transport',name:'移動',photo:'cat-transport.jpg'},
 {id:'experience',name:'体験',photo:'cat-experience.jpg'}, {id:'events',name:'イベント',photo:'cat-events.jpg'}
];
// 初期掲載のサンプル。店舗の営業状況・料金・口コミ点数は未検証。確定情報として扱わない。
const places=[
 {id:'shiraito',name:'白糸の滝',category:'sight',tags:['自然','絶景','観光'],area:'富士宮市上井出',address:'静岡県富士宮市上井出',description:'富士山の湧水が岩壁から幾筋にも流れ落ちる、富士宮を代表する景勝地です。',photo:'spot-shiraito.jpg',demoRating:'4.6',featured:true},
 {id:'sengen',name:'富士山本宮浅間大社',category:'sight',tags:['歴史','神社','観光'],area:'富士宮市宮町',address:'静岡県富士宮市宮町1-1',description:'富士山信仰の中心として知られ、境内には湧玉池があります。',photo:'spot-sengen.jpg',demoRating:'4.5',featured:true,site:'http://www.fuji-hongu.or.jp/sengen/'},
 {id:'asagiri',name:'朝霧高原',category:'experience',tags:['自然','絶景','牧場','観光'],area:'富士宮市根原',address:'静岡県富士宮市根原',description:'富士山西麓に広がる高原地帯。牧草地と雄大な富士山の眺めを楽しめます。',photo:'spot-asagiri.jpg',demoRating:'4.4',featured:true},
 {id:'yakisoba',name:'富士宮やきそばアンテナショップ',category:'eat',tags:['富士宮焼きそば','ご当地グルメ','お宮横丁'],area:'富士宮市宮町',address:'静岡県富士宮市宮町4-23 お宮横丁内',description:'富士宮やきそばを手軽に楽しめる、お宮横丁内の店舗。',photo:'cat-eat.jpg',phone:'0544-22-5341',site:'https://prosumer-inc.com/our-store/'},
 {id:'omiyayokocho',name:'お宮横丁',category:'shop',tags:['食べる','買う','土産'],area:'富士宮市宮町',address:'静岡県富士宮市宮町4-23',description:'富士山本宮浅間大社近くでご当地グルメやお土産を楽しめるスポット。',photo:'cat-shop.jpg'},
 {id:'tanuki',name:'田貫湖',category:'sight',tags:['自然','湖','富士山','体験'],area:'富士宮市佐折',address:'静岡県富士宮市佐折',description:'富士山を望む自然豊かな湖。湖畔で散策や景色を楽しめます。',photo:'spot-asagiri.jpg'},
 {id:'greenhotel',name:'富士宮グリーンホテル',category:'stay',tags:['ホテル','宿泊','駅近'],area:'富士宮市',address:'静岡県富士宮市',description:'富士宮市内の宿泊施設。予約や最新設備は公式サイトをご確認ください。',photo:'cat-stay.jpg',site:'https://www.fujigreenhotel.co.jp/'},
 {id:'hananoyu',name:'富嶽温泉 花の湯',category:'onsen',tags:['温泉','入浴','リラックス'],area:'富士宮市',address:'静岡県富士宮市',description:'富士宮市内で温泉やリラクゼーションを楽しめる施設。',photo:'cat-onsen.jpg'},
 {id:'station',name:'富士宮駅',category:'transport',tags:['鉄道','駅','JR身延線','移動'],area:'富士宮市中央町',address:'静岡県富士宮市中央町',description:'JR身延線の駅。市内の観光・移動の拠点です。',photo:'cat-transport.jpg'},
 {id:'makaibokujyo',name:'まかいの牧場',category:'experience',tags:['牧場','動物','家族','体験'],area:'富士宮市内野',address:'静岡県富士宮市内野',description:'朝霧高原エリアの体験型牧場。自然の中で動物とのふれあいを楽しめます。',photo:'spot-asagiri.jpg'}
];
const featured=places.filter(p=>p.featured);
const asset=s=>'assets/'+s;
const favKey='fujinomiya-superapp-favorites-v1';
let favorites=new Set();try{const stored=JSON.parse(localStorage.getItem(favKey)||'[]');favorites=new Set(Array.isArray(stored)?stored:[])}catch{}
let view='home',prevView='home',selectedCat='all',searchTerm='',sort='recommended',hasCoords=false,userCoords=null,toastTimer=null;
const normalize=t=>String(t||'').normalize('NFKC').toLowerCase().replace(/[ぁ-ん]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60)).replace(/\s+/g,' ').trim();
function message(t){const x=$('toast');x.textContent=t;x.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove('visible'),2400)}
function saveFav(){try{localStorage.setItem(favKey,JSON.stringify([...favorites]))}catch{message('お気に入りの保存に失敗しました')}}
function toggleFav(id){favorites.has(id)?favorites.delete(id):favorites.add(id);saveFav();renderRec();if(view==='favorites')renderFav();if(view==='search')renderResults();if(view==='detail')openDetail(id,true);message(favorites.has(id)?'お気に入りに追加しました':'お気に入りを解除しました')}
function renderCats(){ $('categoryGrid').innerHTML=categories.map(c=>`<button class="cat-card" data-category="${c.id}" aria-label="${c.name}のスポットを見る"><img loading="lazy" class="cat-photo" src="${asset(c.photo)}" alt=""><span class="cat-name">${c.name}${icon('chevron')}</span></button>`).join('') }
function renderRec(){ $('recommendGrid').innerHTML=featured.map(p=>`<article class="rec-card"><div class="rec-cover" data-detail="${p.id}"><img src="${asset(p.photo)}" alt="${p.name}"/><button class="heart-target" data-favorite="${p.id}" aria-label="${p.name}をお気に入りに${favorites.has(p.id)?'登録済み':'登録'}" aria-pressed="${favorites.has(p.id)}">${icon('heart')}</button></div><div class="rec-text" data-detail="${p.id}"><div class="rec-title">${p.name}</div><div class="rec-meta" title="評価はデザイン再現用の参考表示です"><span class="star">★</span><span>${p.demoRating||''}</span>${icon('pin')}<span class="region">${p.area}</span></div></div></article>`).join('') }
function allResults(favs=false){
 let results=places.filter(p=> (!favs||favorites.has(p.id))&&(selectedCat==='all'||p.category===selectedCat));
 let terms=normalize(searchTerm).split(' ').filter(Boolean);
 if(terms.length)results=results.filter(p=>terms.every(t=>normalize([p.name,p.address,p.area,p.description,...p.tags].join(' ')).includes(t)));
 if($('hasWebsite').checked)results=results.filter(p=>!!p.site);
 if($('hasAddress').checked)results=results.filter(p=>!!p.address);
 if($('onlyFavorites').checked)results=results.filter(p=>favorites.has(p.id));
 if(sort==='name')results.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
 if(sort==='popular')results.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));
 return results;
}
function resultHtml(p){return `<article class="result-card"><img class="result-img" alt="${clean(p.name)}" src="${asset(p.photo)}" loading="lazy"/><div class="result-body"><span class="result-category">${clean(categories.find(c=>c.id===p.category)?.name||'スポット')}</span><div class="result-name">${clean(p.name)}</div><p class="result-description">${clean(p.area)}<br>${clean(p.description)}</p><div class="result-actions"><button class="mini-btn primary" data-detail="${p.id}">詳しく見る ${icon('chevron')}</button><button class="mini-btn" data-favorite="${p.id}">${icon('heart')} ${favorites.has(p.id)?'保存済み':'保存'}</button></div></div></article>`}
function renderFilters(){ $('searchCategories').innerHTML=[{id:'all',name:'すべて'},...categories].map(c=>`<button class="pill ${selectedCat===c.id?'active':''}" data-category="${c.id}">${c.name}</button>`).join('') }
function renderResults(){renderFilters();let results=allResults();$('resultCount').textContent=`${results.length}件のスポットを表示中（初期掲載サンプル）`; $('searchResults').innerHTML=results.length?results.map(resultHtml).join(''):`<div class="empty">${icon('search')}<div>条件に合うスポットが見つかりません。<br>別のキーワードで検索してください。</div></div>`}
function renderFav(){let p=places.filter(x=>favorites.has(x.id));$('favoriteResults').innerHTML=p.length?p.map(resultHtml).join(''):`<div class="empty">${icon('heart')}<div>まだお気に入りはありません。<br>気になるスポットのハートを押してください。</div><button class="action-btn" data-view="search" style="margin-top:17px">スポットを探す</button></div>`}
function renderMap(){const lat=userCoords?.lat??35.223,lon=userCoords?.lon??138.615,delta=userCoords?.lat?.025:.087; const bbox=[lon-delta,lat-delta*.62,lon+delta,lat+delta*.62].join('%2C');const marker=userCoords?`&marker=${encodeURIComponent(lat+','+lon)}`:'';const url=`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;if($('osmMap').getAttribute('src')!==url)$('osmMap').src=url; $('mapPlaces').innerHTML=featured.map(p=>`<button class="menu-link" data-mapplace="${p.id}">${icon('pin')} ${p.name} — 地図を開く ${icon('external')}</button>`).join('')}
function mapUrl(p){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.address?`${p.name} ${p.address}`:p.name+' 富士宮市')}
function routeUrl(p){let u='https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(`${p.name} ${p.address}`);if(userCoords)u+='&origin='+encodeURIComponent(userCoords.lat+','+userCoords.lon);return u}
function openDetail(id,rerender=false){let p=places.find(p=>p.id===id);if(!p)return;if(!rerender){prevView=view;showView('detail')} $('detailBody').innerHTML=`<img class="spot-hero" src="${asset(p.photo)}" alt="${clean(p.name)}"><div class="spot-type">${clean(categories.find(c=>c.id===p.category)?.name||'観光スポット')} · ${clean(p.area)}</div><h2 class="spot-detail-title">${clean(p.name)}</h2><p class="detail-desc">${clean(p.description)}</p><div class="detail-box"><div>📍 ${clean(p.address||'住所詳細は確認中です')}</div>${p.phone?`<div>☎ ${clean(p.phone)}</div>`:''}<div>営業時間・休業日・料金は公式情報をご確認ください。</div></div><div class="detail-actions"><button class="action-btn" data-route="${id}">現在地から行く</button><button class="action-btn secondary" data-mapplace="${id}">地図で見る</button><button class="action-btn secondary" data-favorite="${id}">${favorites.has(id)?'♥ 保存済み':'♡ お気に入り'}</button>${p.site?`<button class="action-btn secondary" data-external="${clean(p.site)}">公式サイトを見る</button>`:''}${p.phone?`<button class="action-btn secondary" data-external="tel:${clean(p.phone)}">電話する</button>`:''}</div><p class="powered-note">掲載データは開発用の初期サンプルです。画像はイメージを含みます。訪問前に現地の最新情報をご確認ください。</p>`}
function showView(next){if(!$(next))return;view=next;document.querySelectorAll('.main-view').forEach(v=>v.classList.toggle('active',v.id===next)); document.querySelectorAll('.bottom-nav .nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===next));window.scrollTo({top:0,behavior:'instant'});if(next==='search')renderResults();if(next==='favorites')renderFav();if(next==='map')renderMap();$('menuOverlay').classList.remove('open')}
function openSearch(cat='all',q=''){selectedCat=cat;searchTerm=q;sort='recommended';$('queryInput').value=q;$('hasWebsite').checked=false;$('hasAddress').checked=false;$('onlyFavorites').checked=false;showView('search');$('searchTitle').textContent=categories.find(x=>x.id===cat)?.name||'スポットを探す'}
async function getLocation(){return new Promise((resolve,reject)=>{if(!navigator.geolocation){reject(new Error('位置情報を利用できません'));return;} navigator.geolocation.getCurrentPosition(pos=>{userCoords={lat:pos.coords.latitude,lon:pos.coords.longitude};hasCoords=true;resolve(userCoords)},()=>reject(new Error('ブラウザの位置情報の利用許可をご確認ください')), {enableHighAccuracy:false,timeout:10000,maximumAge:120000})})}
function homeToSearch(){openSearch('all',$('homeSearch').value.trim())}
function sendTalk(q){q=String(q||'').trim();if(!q)return;const area=$('talkChat');const bubble=document.createElement('div');bubble.className='bubble user';bubble.textContent=q;area.appendChild(bubble);let answer;if(/焼きそば|やきそば|食べ/.test(q))answer='富士宮やきそばは、コシのある麺と肉かす、だし粉などが特徴です。「食べる」から掲載店舗を探せます。営業時間や提供状況は店舗にご確認ください。';else if(/コース|まわり|巡/.test(q))answer='初めてなら「富士山本宮浅間大社 → お宮横丁」を中心にした市街地散策がおすすめ。自然を楽しむなら白糸の滝や朝霧高原も候補です。移動時間や現地の営業状況は事前に確認してください。';else if(/バス|電車|交通|アクセス|駅/.test(q))answer='富士宮駅はJR身延線の駅です。観光地へのアクセスは鉄道・路線バス・タクシーなどを組み合わせてください。最新の時刻表は各交通事業者で確認できます。';else if(/滝|富士山|観光|おすすめ|スポット|浅間|朝霧/.test(q))answer='富士宮には白糸の滝、富士山本宮浅間大社、朝霧高原、田貫湖などがあります。ホームの「おすすめスポット」や「観光」から見つけられます。';else answer='富士宮の観光・グルメ・交通を探すには、ホームの検索欄もお試しください。こちらは固定の案内文で答える簡易版です。';const reply=document.createElement('div');reply.className='bubble';reply.textContent=answer;area.appendChild(reply);area.scrollTop=area.scrollHeight}
// Event delegation — every prominent menu/control is clickable
 document.addEventListener('click',e=>{
   let t=e.target.closest('[data-favorite]');if(t){e.stopPropagation();toggleFav(t.dataset.favorite);return}
   t=e.target.closest('[data-route]');if(t){let p=places.find(x=>x.id===t.dataset.route);if(p)window.open(routeUrl(p),'_blank','noopener');return}
   t=e.target.closest('[data-mapplace]');if(t){let p=places.find(x=>x.id===t.dataset.mapplace);if(p)window.open(mapUrl(p),'_blank','noopener');return}
   t=e.target.closest('[data-external]');if(t){let url=t.dataset.external;if(/^https?:\/\//.test(url)||/^tel:/.test(url))window.open(url,'_blank','noopener');return}
   t=e.target.closest('[data-detail]');if(t){openDetail(t.dataset.detail);return}
   t=e.target.closest('[data-category]');if(t){openSearch(t.dataset.category);return}
   t=e.target.closest('[data-view]');if(t){showView(t.dataset.view);return}
   t=e.target.closest('[data-chat]');if(t){sendTalk(t.dataset.chat);return}
 });
$('homeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')homeToSearch()});$('homeSearch').addEventListener('search',()=>{if($('homeSearch').value)homeToSearch()});
$('homeFilter').addEventListener('click',()=>{homeToSearch();$('filterPanel').classList.remove('hide')});
$('searchFilterToggle').addEventListener('click',()=>$('filterPanel').classList.toggle('hide'));
$('queryInput').addEventListener('input',e=>{searchTerm=e.target.value;renderResults()});
['hasWebsite','hasAddress','onlyFavorites'].forEach(id=>$(id).addEventListener('change',renderResults));
$('nearbyBtn').addEventListener('click',async()=>{try{await getLocation();message('現在地を取得しました。地図で観光スポットを確認できます');showView('map')}catch(err){message(err.message)}});
$('popularBtn').addEventListener('click',()=>{openSearch();sort='popular';renderResults();message('おすすめ順に表示しています（評価ランキングではありません）')});
$('openMenu').addEventListener('click',()=>$('menuOverlay').classList.add('open'));
$('closeMenu').addEventListener('click',()=>$('menuOverlay').classList.remove('open'));
$('menuOverlay').addEventListener('click',e=>{if(e.target===$('menuOverlay'))$('menuOverlay').classList.remove('open')});
$('detailBack').addEventListener('click',()=>showView(prevView==='detail'?'home':prevView));
$('talkForm').addEventListener('submit',e=>{e.preventDefault();sendTalk($('talkInput').value);$('talkInput').value=''});
renderCats();renderRec();renderFilters();
if('serviceWorker' in navigator && location.protocol.startsWith('http')){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
