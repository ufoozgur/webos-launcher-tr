# webOS Launcher Türkçe

LG webOS için sade, Türkçe ana ekran. [partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher) projesinin MIT lisanslı uyarlamasıdır.

- Türkçe menüler, gün/ay adları ve 24 saat biçiminde saat.
- Uygulamalar ve HDMI girişleri; kumandayla sıralama ve seçim.
- Kesilmeyen logolar, sayfalı gezinme.
- Her ana uygulama ve giriş için konusuyla ilgili meme GIF. Yalnızca seçili tuşta 180 ms sonra oynar; diğer tuşlar orijinal logolarını gösterir. GIF yüklenemezse normal görsele döner. Dosyalar yereldir; kullanım sırasında internetten GIF indirilmez.
- **Panic Button** LG ana ekranını açar; mevcut meme GIF korunmuştur.
- Denon AVR model bilgisi, TV yanlışlıkla Sound Bar dese de girişin gerçek cihaz bilgisinden gösterilir.
- İsteğe bağlı root araçları: açılışta bu arayüz ve orijinal LG ekran koruyucusunda 100 filmden İngilizce replik.

LG C2 / webOS SDK 11.2.0 üzerinde denenmiştir. Diğer modellerde sistem ayarları farklı olabilir. Root edinme aracı içermez. Mevcut Launcher ile aynı uygulama kimliğini kullanır; onu günceller.

## Derleme ve kurulum

Node.js 22 veya üzeriyle:

```sh
npm ci
npm run check
npm run build
npm run package
```

`build/` altındaki `.ipk` dosyasını webOS Dev Manager veya webOS CLI ile yükleyin. Standart kullanım root gerektirmez. Kalıcı Home ve ekran koruyucu araçları root ve TV'de Python 3 gerektirir. Root edilmiş TV'de Developer Mode uygulamasını tekrar kurmayın; root düzeniyle çakışabilir.

Oklarla gezinilir; OK uygulamayı veya girişi açar. Ayarlar içinden uygulama/giriş seçimi ve sıralama yapılır. Panic Button LG Home'u açar; varsayılan ana ekran tercihini değiştirmez.

## Açılış ve Home tuşu — isteğe bağlı, root

`scripts/tv-home.py` dosyasını TV'nin `/tmp/` klasörüne kopyalayın ve root kabuğunda çalıştırın:

```sh
python3 /tmp/tv-home.py enable
```

Araç yerel Home profilini seçer ve açılışta bir kez uygular; sürekli çalışan bir Home izleyicisi yoktur. Önceki ayarlar `/var/lib/webos-launcher-tr/home-before.json` içinde saklanır. LG Home'a kalıcı dönüş:

```sh
python3 /var/lib/webos-launcher-tr/home.py disable
```

Değişiklikleri geri almadan launcher uygulamasını kaldırmayın.

## Orijinal LG ekran koruyucusunda replikler — isteğe bağlı, root

`scripts/tv-native-quotes.py` ve `screensaver/quotes.en.json` dosyalarını TV'nin `/tmp/` klasörüne kopyalayın:

```sh
python3 /tmp/tv-native-quotes.py enable /tmp/quotes.en.json
```

LG'nin Flutter ekran koruyucusu, analog saati, yazı tipi ve yumuşak geçişleri korunur. Türkçe düğme yönergesinin yerine iki satır gösterilir: ilk satırda tırnak içinde İngilizce replik - karakter (oyuncu), ikinci satırda film (yıl). LG normal satır sonlarını tek satıra indirdiğinden Unicode satır ayırıcı kullanılır. Görünen alan iki satırla sınırlıdır; çok uzun birinci satırlar modele göre kesilebilir. Liste 100 farklı film içerir.

Replik **her yeni ekran koruyucu oturumunda rastgele** seçilir; aynı replik art arda gelmez. Aynı oturum içinde değişmez. LG metni açılışta önbelleğe aldığı için çıkınca rastgele seçilen sonraki metin hazırlanır ve arka planda kalan ekran koruyucu kapatılır. Sonraki girişte LG yeniden yükler. Görünme süresi ve saatle geçişin ritmi LG'nin kendi davranışıdır; metin uzunluğuna göre değiştirilmez.

Küçük bir Python dinleyicisi güç durumu olaylarını bekler; düzenli sorgu yapmaz. Sistem dosyası silinmez: Türkçe çeviri dosyasının üzerine geçici bir bind mount uygulanır. Açılış betiği bunu tekrar kurar. Diğer diller etkilenmez. Sistem güncellemeleri sonrasında yeniden doğrulama gerekebilir.

Durum ve geri alma:

```sh
python3 /var/lib/webos-launcher-tr/flutter-text/native-quotes.py status
python3 /var/lib/webos-launcher-tr/flutter-text/native-quotes.py disable
```

Geri alma dinleyiciyi ve açılış betiğini kapatır, orijinal çeviriyi yeniden görünür kılar. Etkin ekran koruyucu varsa çıkıp tekrar girin. Yedekler korunur.

## Lisans ve kaynaklar

Kod MIT lisanslıdır; orijinal projenin telif bildirimi korunmuştur. Logolar, GIF ve film replikleri ayrı hak sahiplerine aittir; MIT bunları kapsamaz. Ayrıntılar [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) dosyasında.

Bu depo TV bağlantı bilgileri, hesaplar, özel anahtarlar veya IPTV oynatma listeleri içermez.
