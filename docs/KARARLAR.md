# Karar Kaydı

Sonraki geliştirmelerde tutarlılık için önemli kararlar ve gerekçeleri.

## Müfredat ve içerik

| # | Karar | Gerekçe |
|---|---|---|
| K1 | Ünite adı **"Kuvvetin Etkisinde Hareket"** | Ders kitabı ve TYMM (tymm.meb.gov.tr) güncel adı. "Kuvveti Tanıyalım" eski programa aittir. |
| K2 | Öğrenme çıktısı **FB.6.2.1** (a, b) | TYMM sayfasından doğrulandı. Dengelenmiş/dengelenmemiş kuvvetler FB.6.2.2'dir ve bu simülasyonun kapsamı dışındadır. |
| K3 | Kuvvetin **dört** özelliği (uygulama noktası dahil) | Ders kitabı s. 46 ve programın OB4 uygulaması. |
| K4 | Bileşke, önce **aynı yönlü** kuvvetlerle tanımlanır (S5), sonra zıt yönlü (S6–S7) | Ders kitabının sırası; toplama sezgisi farktan kolaydır. Tanım, kitaptaki "aynı etkiyi tek başına yapan kuvvet" ifadesinin görsel testi (iki araba yarışı) ile kurulur. |
| K5 | Top **düşey** atılır (tekme yok) | Tekme eğik yörünge oluşturur; kuvvet ile hareket aynı doğrultuda kalmaz. |
| K6 | Roket **kalkış anında** dondurulur; 100 N / 10 N korunur; 1 kare = 10 N | Rampadayken rampanın kuvveti de vardır. 100 N ve 10 N ile duran bir cisim gösterilemez. |
| K7 | Yön sözcükleri: düşeyde **yukarı/aşağı**, yandan görünüşte yatayda **doğu/batı** | Kitabın bazı düşey çizimlerinde "Kuzey yukarıda" pusula vardır; bu karışıklığa yol açar. Kuzey/güney ekranın düşeyi için hiç kullanılmaz. |
| K8 | Ok renkleri: uygulanan kuvvet **kırmızı**, bileşke **mavi**; yanlış cevap asla kırmızı değil (amber) | Ders kitabıyla uyumlu; renk anlamı tek tutulur. Oklar ayrıca etiket ve kalınlıkla da ayırt edilir. |
| K9 | Hareket animasyonları: durgun cisim **giderek hızlanarak** bileşke yönünde harekete geçer; sahne **donmuş kareyle** biter | Sabit hızla kayma ya da kendiliğinden yavaşlayıp durma, yanlış kuvvet–hareket fikri verir. |
| K10 | Değerler temsilîdir; elma ≈ 1 N, "1 kare = x N" ölçeği her diyagramda görünür | Gerçekçi olmayan sayıların gerçekmiş gibi sunulmaması. |
| K12 | 1. bölümün adı **"Kuvveti Tanıyalım"** | Öğretmen tercihi; "Kuvveti Görmek" Türkçede doğal durmuyordu. |
| K11 | Yalnızca 6 temel görev + 1 yıldızlı görev; süre sınırı ve puan yok | Talimattaki oyunlaştırma sınırları; görevler ders kitabı pekiştirme istasyonlarıyla örtüşür. |

## Teknik

| # | Karar | Gerekçe |
|---|---|---|
| T1 | Vite + React + TypeScript; yalnızca **GSAP** ek çalışma zamanı bağımlılığı | Senaryolu zaman çizelgeleri, küresel duraklatma ve geri alma (gsap.context) için. GSAP 2025'ten beri ücretsizdir. |
| T2 | Kendi sahne motoru (async betik + AbortSignal), XState yok | Bu ölçek için yeterli ve okunabilir; iptal ve temizlik tek yerde. |
| T3 | Tüm çizimler **SVG**, 1920×1080 mantıksal sahne, CSS ölçekleme | Her çözünürlükte keskin; dokunma hedefleri DOM üzerinde. |
| T4 | Pointer Events + "seç-yerleştir" alternatifi; yalnızca birincil işaretçi | Fare/dokunmatik/kalem tek mantık; avuç dokunuşu sürüklemeyi bozmaz. |
| T5 | Hash yönlendirme, `base: './'` | Uygulama sunucu ayarı olmadan bir klasörden/USB'den açılabilir. |
| T6 | Sesler geliştirme sırasında EMA ile üretilir, **MP3 64 kbps mono** | EMA okul bilgisayarlarında yok; WAV 55 MB yerine MP3 4,3 MB. |
| T7 | Anlatım zamanlaması manifestteki **gerçek süreye** göre yürür, ses paralel çalar | Ses kapalıyken veya dosya eksikken akış aynen sürer; duraklatma sesi ve zamanlayıcıyı birlikte durdurur. |
| T8 | Yönerge anlatımları etkileşimi engellemez (`narrateBg`); "Kontrol Et" tıklaması anlatım sürerken de kaybolmaz (sinyal tamponu) | Öğrencinin anlatımın bitmesini beklemek zorunda kalmaması. |
| T9 | Gezinme düğmelerinde 350 ms kilit | Hızlı art arda dokunuşların sahne atlatmasını önler. |
| T11 | Geri bildirim kartları ~4 sn sonra kendiliğinden kaybolur; anlatım ve altyazı sürer | Kartın sahnenin üzerinde kalıcı durması dikkat dağıtıyordu (öğretmen geri bildirimi). |
| T12 | Sahne 1'de elmanın sap kopması, düşüşü ve yere çarpması Web Audio ile üretilen seslerle desteklenir | Daha etkileyici ve akılda kalıcı açılış; ses dosyası gerektirmez, ses kapalıysa çalmaz. |
| T10 | Sayfa yazı tipi Lexend, **yerel paket** (@fontsource) | Okulda internet olmasa da çalışsın; Türkçe karakter desteği. |

## Bilinen sınırlar / sonraki adımlar

- İllüstrasyonlar kodla çizilmiş SVG'lerdir; tasarımcı çizimleriyle değiştirilebilir (bileşenler `src/art/`).
- Anlatımlar segment (cümle grubu) düzeyinde senkronizedir; EMA kelime zaman damgası vermediği için kelime düzeyinde vurgu yoktur.
- Eski ETAP/Pardus tarayıcılarında gerçek cihaz testi henüz yapılmadı (Chromium ile otomatik test edildi).
