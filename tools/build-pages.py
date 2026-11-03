#!/usr/bin/env python3
"""Erzeugt aus index.html eigene, direkt aufrufbare Seiten pro Unterseite (SEO).

Nach jeder Änderung an index.html einmal ausführen:  python3 tools/build-pages.py
Danach committen. Netlify braucht keinen Build-Schritt (spart Credits).
"""
import json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://kfz-chaves.de'

ROUTES = {
    'start': ('/', 'Kfz-Werkstatt München-Aubing | KFZ Chaves Meisterbetrieb',
              'Ihre Kfz-Meisterwerkstatt in München-Aubing für alle Marken: Inspektion, Reparatur, Zahnriemen, Bremsen und HU/AU-Vorbereitung. Jetzt Termin online anfragen.'),
    'ueber': ('/ueber-uns/', 'Über uns – KFZ Chaves Meisterwerkstatt München',
              'Inhabergeführte Kfz-Meisterwerkstatt in München-Aubing: ehrliche Beratung, transparente Preise und Service für alle Marken.'),
    'services': ('/leistungen/', 'Leistungen & Preise – KFZ Chaves München-Aubing',
                 'Inspektion, Ölwechsel, Reifen, Bremsen, Zahnriemen, Klimaservice, Motorreparatur und HU/AU-Vorbereitung – mit transparenten Preisen in München-Aubing.'),
    'kontakt': ('/kontakt/', 'Kontakt & Anfahrt – KFZ Chaves München-Aubing',
                'KFZ Chaves, Bodenseestr. 275, 81249 München. Telefon 089 89557334. Öffnungszeiten, Kontaktformular und Anfahrt.'),
    'booking': ('/termin/', 'Werkstatttermin online anfragen – KFZ Chaves München',
                'In 5 Schritten zum Werkstatttermin: Fahrzeug, Leistung und Wunschtermin wählen – unverbindlich und kostenlos anfragen.'),
    'blog': ('/ratgeber/', 'Ratgeber rund ums Auto – KFZ Chaves München',
             'Tipps von Ihrer Meisterwerkstatt: Ölwechsel, Reifen, Zahnriemen, HU/AU, Bremsen und Elektroauto-Wartung verständlich erklärt.'),
    'blog-oel': ('/ratgeber/oelwechsel/', 'Ölwechsel: Wann ist der richtige Zeitpunkt? | KFZ Chaves',
                 'Wie oft muss das Motoröl gewechselt werden und woran erkennen Sie, dass es Zeit ist? Der Ratgeber Ihrer Meisterwerkstatt in München.'),
    'blog-reifen': ('/ratgeber/sommerreifen-winterreifen/', 'Sommer- vs. Winterreifen: Was gilt wann? | KFZ Chaves',
                    'Situative Winterreifenpflicht, Profiltiefe und der richtige Zeitpunkt zum Wechseln: Was Autofahrer beim Reifenwechsel wissen müssen.'),
    'blog-zahnriemen': ('/ratgeber/zahnriemenwechsel/', 'Zahnriemenwechsel: Wann und warum? | KFZ Chaves',
                        'Warum ein gerissener Zahnriemen den Motor zerstören kann und wann der Wechsel fällig ist – erklärt von Ihrer Meisterwerkstatt.'),
    'blog-hu': ('/ratgeber/hu-au-vorbereitung/', 'HU/AU bestehen: So bereiten Sie sich vor | KFZ Chaves',
                'Was bei der Hauptuntersuchung geprüft wird und wie ein Vorcheck in der Werkstatt teure Nachprüfungen vermeidet.'),
    'blog-elektro': ('/ratgeber/elektroauto-werkstatt/', 'Elektroauto in der Werkstatt: Was ist anders? | KFZ Chaves',
                     'Kein Ölwechsel, aber trotzdem Wartung: Worauf es beim Elektroauto in der Werkstatt ankommt.'),
    'blog-bremse': ('/ratgeber/bremsen-wechseln/', '5 Zeichen, dass die Bremsen gewechselt werden müssen',
                    'Quietschen, Vibrationen, längerer Bremsweg: Diese Warnzeichen sollten Sie ernst nehmen – Bremsenservice in München-Aubing.'),
    'detail-wartung': ('/leistungen/inspektion-wartung/', 'Inspektion & Wartung München-Aubing | KFZ Chaves',
                       'Inspektion und Wartung für alle Marken in München-Aubing: Ölwechsel, Filter, Flüssigkeiten und Sicherheitscheck – mit transparenten Preisen.'),
    'detail-motor': ('/leistungen/motorreparatur/', 'Motorreparatur München-Aubing | KFZ Chaves',
                     'Motordiagnose und Motorreparatur für alle Marken: transparenter Befund und wirtschaftliche Lösung von Ihrer Meisterwerkstatt.'),
    'detail-zahnriemen': ('/leistungen/zahnriemenwechsel/', 'Zahnriemenwechsel München-Aubing | KFZ Chaves',
                          'Zahnriemen- und Steuerkettenwechsel für alle Marken – rechtzeitig wechseln und teure Motorschäden vermeiden.'),
    'detail-huau': ('/leistungen/hu-au/', 'HU/AU-Vorbereitung München-Aubing | KFZ Chaves',
                    'Vorcheck vor der Hauptuntersuchung: Wir prüfen Ihr Fahrzeug und beheben Mängel vorab – für eine entspannte HU/AU.'),
    'impressum': ('/impressum/', 'Impressum – KFZ Chaves', 'Impressum der KFZ Chaves Meisterwerkstatt, Bodenseestr. 275, 81249 München.'),
    'datenschutz': ('/datenschutz/', 'Datenschutzerklärung – KFZ Chaves', 'Datenschutzerklärung der KFZ Chaves Meisterwerkstatt München.', True),
    'agb': ('/agb/', 'AGB – KFZ Chaves', 'Allgemeine Geschäftsbedingungen der KFZ Chaves Meisterwerkstatt München.', True),
    'widerruf': ('/widerruf/', 'Widerrufsbelehrung – KFZ Chaves', 'Widerrufsbelehrung der KFZ Chaves Meisterwerkstatt München.', True),
    'cookies': ('/cookies/', 'Cookie-Richtlinie – KFZ Chaves', 'Cookie-Richtlinie der KFZ Chaves Meisterwerkstatt München.', True),
}


def esc(t):
    return t.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def head(pid):
    r = ROUTES[pid]
    path, title, desc = r[0], r[1], r[2]
    noindex = len(r) > 3 and r[3]
    url = BASE + path
    return (
        f'<!--SEO-START--><title>{esc(title)}</title>\n'
        f'<meta name="description" content="{esc(desc)}"/>\n'
        f'<meta name="robots" content="{"noindex, follow" if noindex else "index, follow"}"/>\n'
        f'<link rel="canonical" href="{url}"/>\n'
        f'<meta property="og:type" content="website"/>\n'
        f'<meta property="og:locale" content="de_DE"/>\n'
        f'<meta property="og:site_name" content="KFZ Chaves"/>\n'
        f'<meta property="og:title" content="{esc(title)}"/>\n'
        f'<meta property="og:description" content="{esc(desc)}"/>\n'
        f'<meta property="og:url" content="{url}"/>\n'
        f'<meta property="og:image" content="{BASE}/img/og-kfz-chaves.jpg"/>\n'
        f'<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>\n'
        f'<meta name="twitter:card" content="summary_large_image"/>\n'
        f'<!--SEO-END-->'
    )


def routes_js():
    data = {pid: {'path': r[0], 'title': r[1], 'desc': r[2], 'noindex': bool(len(r) > 3 and r[3])} for pid, r in ROUTES.items()}
    return '<!--ROUTES-START--><script>window.CHAVES_ROUTES=' + json.dumps(data, ensure_ascii=False) + ';</script><script src="/js/routes.js" defer></script><!--ROUTES-END-->'


def render(src, pid):
    s = re.sub(r'<!--SEO-START-->.*?<!--SEO-END-->', lambda m: head(pid), src, count=1, flags=re.S)
    s = re.sub(r'<!--ROUTES-START-->.*?<!--ROUTES-END-->', lambda m: routes_js(), s, count=1, flags=re.S)
    # aktive Seite setzen
    s = s.replace('class="page active"', 'class="page"')
    s = s.replace(f'id="page-{pid}" class="page"', f'id="page-{pid}" class="page active"', 1)
    s = s.replace('<span id="nav-start" class="active"', '<span id="nav-start"')
    s = re.sub(rf'<span id="nav-{re.escape(pid)}"(?! class)', f'<span id="nav-{pid}" class="active"', s, count=1)
    return s


def main():
    idx = os.path.join(ROOT, 'index.html')
    src = open(idx, encoding='utf-8').read()
    if '<!--ROUTES-START-->' not in src:
        i = src.index('<script src="/js/gsap.min.js"')
        src = src[:i] + '<!--ROUTES-START--><!--ROUTES-END-->\n' + src[i:]
    for pid, r in ROUTES.items():
        out = render(src, pid)
        if pid == 'start':
            open(idx, 'w', encoding='utf-8').write(out)
            continue
        d = os.path.join(ROOT, r[0].strip('/'))
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(out)
    # Sitemap
    urls = [r[0] for r in ROUTES.values() if not (len(r) > 3 and r[3])]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        pr = '1.0' if u == '/' else ('0.8' if u.count('/') <= 2 else '0.6')
        sm += f'  <url><loc>{BASE}{u}</loc><priority>{pr}</priority></url>\n'
    sm += '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)
    print(f'{len(ROUTES)} Seiten erzeugt, Sitemap mit {len(urls)} URLs')


if __name__ == '__main__':
    main()
