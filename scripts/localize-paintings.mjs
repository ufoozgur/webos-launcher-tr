import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../screensaver');
const titles={
435600:'Patmos’ta Aziz Yuhanna',435621:'Jeanne d’Arc',435641:'Meryem ve Çocuk İsa',435702:'At Pazarı',435728:'Aziz Hieronymus’un Son Komünyonu',435739:'Venüs’ün Tuvaleti',435802:'Genç Bir Adamın Portresi',435809:'Hasatçılar',435817:'Meryem ve Aziz Yuhanna ile Çarmıha Geriliş',435826:'Aşk Şarkısı',435839:'San Marco Meydanı',435844:'Müzisyenler',435851:'İsa’nın Çilesi Üzerine Tefekkür',435853:'Meryem’in Taçlandırılması',435868:'İskambil Oyuncuları',435876:'Kırmızı Elbiseli Madame Cézanne',435882:'Elmalar ve Bir Saksı Çuha Çiçeğiyle Natürmort',435888:'Sabun Köpükleri',435896:'Bir Kartuz Rahibinin Portresi',435908:'Donanmalarını Ateşe Veren Troyalı Kadınlar',435962:'Çölde Hacer',435984:'Sibylle',436002:'Papağanlı Kadın',436037:'Paris’in Yargısı',436095:'Üçüncü Sınıf Vagon',436101:'Mısır’a Kaçışta Dinlenme',436105:'Sokrates’in Ölümü',436106:'Antoine Laurent Lavoisier ve Marie Anne Lavoisier',436121:'Çiçek Vazosunun Yanında Oturan Kadın (Madame Paul Valpinçon?)',436244:'Azize Anna ile Meryem ve Çocuk İsa',436253:'Lucas van Uffel’in Portresi',436282:'Çarmıha Geriliş ve Son Yargı',436323:'Köpeğiyle Marie Emilie Coignet de Courson',436440:'Köy Çocukları (Odun Toplayanlar)',436504:'Müneccim Kralların Tapınması',436516:'Şöhretin Zaferi (arka yüz: Medici ve Tornabuoni ailelerinin armaları)',436528:'Süsenler',436532:'Hasır Şapkalı Otoportre (diğer yüz: Patates Soyucu)',436535:'Servili Buğday Tarlası',436545:'Manuel Osorio Manrique de Zuñiga’nın Portresi',436573:'Kardinal Fernando Niño de Guevara’nın Portresi',436575:'Toledo Manzarası',436579:'Kırık Yumurtalar',436603:'Filistîler Tarafından Yakalanan Şimşon',436622:'Karnaval Eğlencesi',436658:'Hermann von Wedigh III’ün Portresi',436792:'Azizler ve Bağışçıyla Çarmıha Geriliş',436819:'Mäda Primavesi’nin Portresi',436838:'Falcı',436839:'Tövbekâr Mecdelli Meryem',436840:'İki Öğrencisiyle Otoportre',436851:'Elizabeth Farren’in Portresi (sonradan Derby Kontesi)',436892:'Meryem ve Çocuk İsa',436896:'Pencere Önünde Bir Kadın ve Bir Adamın Portresi',436918:'Venüs ve Aşk Tanrısı',436944:'İspanyol Şarkıcı',436947:'Kayık Gezintisi',436964:'1866’da Genç Bir Kadın',436966:'Çobanların Tapınması',437053:'İkindi Yemeği'
};
export function turkishArtDate(input){
 let text=input.trim();
 text=text.replace(/(\d{4})[–-](\d{2})(?!\d)/g,(_,a,b)=>a+'–'+a.slice(0,2)+b);
 text=text.replace(/shortly after (\d{4})/gi,'$1 yılından kısa süre sonra')
  .replace(/before (\d{4})/gi,'$1 yılından önce').replace(/after (\d{4})/gi,'$1 yılından sonra')
  .replace(/\bprobably\b/gi,'büyük olasılıkla').replace(/\bpossibly\b/gi,'muhtemelen').replace(/\bca\./gi,'yaklaşık');
 text=text.replace(/\b(early|late) (\d{4})s\b/gi,(_,when,n)=>n+(['20','50','70','80'].includes(n.slice(-2))?'’lerin':'’ların')+(when.toLowerCase()==='early'?' başları':' sonları'));
 text=text.replace(/\b(\d{4})s\b/g,(_,n)=>n+(['20','50','70','80'].includes(n.slice(-2))?'’ler':'’lar'));
 return text;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
const paintings=JSON.parse(fs.readFileSync(path.join(base,'paintings.json'),'utf8'));
for(const work of paintings){work.titleTr=titles[work.id]||work.title;work.dateTr=turkishArtDate(work.year);}
fs.writeFileSync(path.join(base,'paintings.json'),JSON.stringify(paintings,null,2)+'\n');
console.log(paintings.length+' tablo adı ve tarihi Türkçeleştirildi.');
}
