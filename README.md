# webOS Launcher Türkçe

LG webOS için sade ana ekran. [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher) projesinin MIT lisanslı uyarlamasıdır. LG C2 / webOS SDK 11.2.0 üzerinde denenmiştir.

- Türkçe menüler, gün/ay adları ve 24 saat biçiminde saat.
- Uygulama ve HDMI seçimi/sıralaması; kesilmeyen logolar.
- Tuşla ilgili meme GIF’leri yalnızca seçili tuşta oynar; arka planda durur.
- **Panic Button:** LG ana ekranına döner.
- **Ben Yokum:** kurulu ekran koruyucu uygulamasını açar. Özel koruyucu aşağıdaki root modülüyle kurulur.
- **Tavşan Deliği:** her basışta internetten yeni YouTube arama sonuçları alır, rastgele bir videoyu YouTube’da doğrudan açar. Son 150 seçimden kaçınır.

Tavşan Deliği çeşitli konular, sıralamalar ve arama sayfaları kullanır; YouTube’un bütün videolarından eşit olasılıkla seçim değildir. Anahtar gerektirmeyen bir Invidious API sunucusu kullanır; sunucu çalışmazsa hata gösterir, sabit video listesine dönmez. Sunucu adresi `src/lib/randomVideo.ts` içindedir. Arama sağlayıcısı bağlantının IP adresini ve arama konusunu görebilir; YouTube hesabı veya çerezleri gönderilmez.

## Derleme ve kurulum

Node.js 22 veya üzeriyle:

```sh
npm ci
npm run check
npm run build
npm run package
```

`build/` içindeki `.ipk` dosyasını webOS Dev Manager veya webOS CLI ile yükleyin. Standart launcher root gerektirmez. Aşağıdaki sistem özelleştirmeleri root ve TV’de Python 3 gerektirir. Root edinme aracı içermez. Mevcut Launcher ile aynı kimliği kullanır ve onu günceller. Root edilmiş TV’de Developer Mode uygulamasını tekrar kurmayın.

Oklarla gezinilir; OK açar. Ayarlar’dan uygulama/giriş seçimi ve sıralaması yapılır. Panic Button varsayılan Home seçimini değiştirmeden LG Home’u açar.

## Açılış ve Home tuşu — isteğe bağlı, root

`scripts/tv-home.py` dosyasını TV’de `/tmp/tv-home.py` konumuna kopyalayın:

```sh
python3 /tmp/tv-home.py enable
```

Araç yerel Home profilini seçer, açılışta bir kez uygular; sürekli Home izleyicisi çalıştırmaz. Yedek: `/var/lib/webos-launcher-tr/home-before.json`.

Geri alma:

```sh
python3 /var/lib/webos-launcher-tr/home.py disable
```

## Üç modlu akıcı ekran koruyucu — isteğe bağlı, root

Bu mod, LG’nin analog saat görünümüne benzer bir QML ekran koruyucusudur. Orijinal LG Flutter uygulaması değildir. Orijinal dosyalar silinmez; uygulama klasörüne geri alınabilir bir bind mount uygulanır.

- Analog saat, Türkçe tarih ve yavaş dönen çember.
- Saat ve replik arasında yumuşak kararma/açılma; replik için süreç yeniden başlatılmaz.
- **100 farklı film** karıştırılmış desteden seçilir. Destenin tamamı bitmeden film tekrar etmez; yeni deste sınırında da aynı film art arda gelmez.
- Deste durumu diske kaydedilir; yeni oturumlarda kaldığı yerden sürer.
- Üç satır: replik; karakter (oyuncu); film (yıl). Yalnızca replik filme uygun altı yazı tipi ailesinden biriyle yazılır; diğer bilgiler sade kalır.
- Okuma süresi metnin uzunluğuna göre 13–35 saniyedir. Gösterim konumu değişir.
- Bir kumanda tuşu veya tıklama koruyucudan çıkarır. Çember ve geçişler görünürken animasyon çalışır; saat yalnızca gerektiğinde yeniden çizilir.

### Ekran koruyucu seçimi (1.5.0)

**Ayarlar → Seçenekler** altında bir mod seçin:

- **Film replikleri:** 100 farklı film, İngilizce replik ve üç satırlı bilgiler.
- **İlginç bilgiler:** NASA, NOAA, USGS, Smithsonian ve Monterey Bay Aquarium kaynaklarından özgün Türkçe anlatımla 100 bilgi. Kaynak kurum ekranda, bağlantılar `screensaver/facts.tr.json` içindedir. Metin uzunluğuna göre 18–45 saniye gösterilir; saatle yumuşak geçiş yapar.
- **Ünlü tablolar:** The Met'in öne çıkan koleksiyonundan **50 sanatçıya ait 60 eser**. Görüntü kırpılmadan ekrana sığar; dikey eserlerin yanında siyah alan kalabilir. Eser adı, sanatçı, yıl ve teknik yarı saydam bir panelde gösterilir. Panel her eserde köşe değiştirir. Her tablo 45 saniye kalır; 1,8 saniyelik yumuşak solmalarla değişir.

Her modun ayrı karıştırılmış destesi vardır; tüm liste bitmeden tekrar etmez, oturumlar arasında durum saklanır. Seçim hem Ben Yokum tuşunda hem TV'nin otomatik çağrısında geçerlidir. Seçimi kaydetmek için görünmeyen kısa bir QML çağrısı kullanılır; ek yetki veya sürekli arka plan servisi eklenmez.

Tablolar TV'de yerel dosyalardır; koruyucu çalışırken internet kullanılmaz. Kaynak depoda büyük resimler yerine CC0 kaynak bağlantıları ve metadata bulunur. Kaynaktan kurulumda masaüstü bilgisayarda önce:

```sh
npm install --no-save sharp
node scripts/download-paintings.mjs
node scripts/build-content.mjs
node scripts/check-content.mjs --require-images
```

İndirme, müzenin özgün görsellerini en fazla 1920×1080 boyutuna oranlarını koruyarak hazırlar. `paintings.json` içindeki SHA-256 değerleri bu sürümün hazırlanmış dosyalarına aittir; farklı sharp sürümleri dosyayı farklı kodlayabilir. İndirmenin başarısız olduğu durumda eksik görsellerle kurmayın. Hazır çevrimdışı pakette 60 görsel bulunur.

Kurulum: `screensaver/` klasörünün tamamını TV’de `/var/lib/webos-launcher-tr/screensaver/` konumuna, `scripts/tv-screensaver.py` dosyasını `/tmp/tv-screensaver.py` konumuna kopyalayın. `Quotes.qml`, `Quotes.js`, `Content.js`, `facts.tr.json`, `paintings.json`, `paintings/` ve `fonts/` aynı klasörün altında bulunmalıdır. Sonra:

```sh
python3 /tmp/tv-screensaver.py enable
```

Daha önce native metin modülü etkinse kurucu onu kapatır. Modül, otomatik LG ekran koruyucusu çağrılarında da kullanılır; launcher’daki Ben Yokum tuşuyla ayrıca açılabilir. Bu tuş standart uygulama açma çağrısını kullanır; launcher’a genel root veya güç yönetimi yetkisi verilmez.

Orijinal LG ekran koruyucusuna dönüş:

```sh
python3 /var/lib/webos-launcher-tr/screensaver.py disable
```

Deste dosyaları ve seçim `/var/lib/webos-launcher-tr/screensaver/` içindeki INI dosyalarında kalır. Orijinal manifest yedeği `/var/lib/webos-launcher-tr/screensaver.original.json` konumundadır. Modülü geri almadan dosyalarını veya launcher’ı kaldırmayın.

## Alternatif: LG’nin orijinal Flutter koruyucusunda metin

LG’nin orijinal render’ını isteyenler özel QML modunu kapatıp `scripts/tv-native-quotes.py` ve `screensaver/quotes.en.json` dosyalarını `/tmp/` konumuna kopyalayabilir:

```sh
python3 /tmp/tv-native-quotes.py enable /tmp/quotes.en.json
```

Bu alternatif yalnızca her yeni oturumda repliği değiştirir. LG metni önbelleğe aldığı için aynı oturum içinde değişim ve özel yazı tipleri yoktur. İki satır için Unicode satır ayırıcı kullanılır. Görünme süresini LG belirler.

```sh
python3 /var/lib/webos-launcher-tr/flutter-text/native-quotes.py disable
```

## Lisans

Kod MIT lisanslıdır; orijinal projenin telif bildirimi korunmuştur. Logolar, GIF’ler ve film replikleri ilgili hak sahiplerine aittir; MIT bunları kapsamaz. Yazı tipleri kendi SIL OFL lisanslarıyla bulunur. Kaynaklar ve ayrıntılar [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) dosyasında.

Depoda TV adresleri, hesaplar, özel SSH anahtarları veya IPTV oynatma listeleri bulunmaz. Sistem güncellemeleri root’u ve bu modülleri etkileyebilir; modüller firmware geri alma yedeği değildir.
