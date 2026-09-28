(function radioItalianeInstalledMarker(){
 if(!window.Spicetify?.LocalStorage||!window.Spicetify?.Config){setTimeout(radioItalianeInstalledMarker,500);return}
 const listKey='marketplace:installed-extensions';
 const itemKey='marketplace:installed:local/radio-italiane/radio-italiane-installed.js';
 const item={
  manifest:{
   name:'Radio Italiane',
   description:'Playlist radio italiane integrata in Spotify.',
   main:'radio-italiane-installed.js',
   tags:['radio','italia','custom-app']
  },
  title:'Radio Italiane',
  subtitle:'Playlist radio italiane integrata in Spotify.',
  authors:[{name:'Locale',url:'https://spicetify.app'}],
  user:'local',
  repo:'radio-italiane',
  branch:'local',
  imageURL:window.RI_COVER||'',
  extensionURL:'radio-italiane-installed.js',
  readmeURL:'',
  stars:0,
  tags:['radio','italia','custom-app']
 };
 const storage=Spicetify.LocalStorage;
 const getItem=key=>typeof storage.getItem==='function'?storage.getItem(key):storage.get(key);
 const setItem=(key,value)=>typeof storage.setItem==='function'?storage.setItem(key,value):storage.set(key,value);
 function read(key,fallback){
  const raw=getItem(key);
  if(!raw)return fallback;
  try{return JSON.parse(raw)}catch{return fallback}
 }
 const installed=read(listKey,[]);
 if(!installed.includes(itemKey))installed.push(itemKey);
 setItem(listKey,JSON.stringify(installed));
 setItem(itemKey,JSON.stringify(item));
 if(!Spicetify.Config.extensions.includes('radio-italiane-installed.js'))Spicetify.Config.extensions.push('radio-italiane-installed.js');
})();
