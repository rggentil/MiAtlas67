# Flag sources

The SVG flags in this folder are downloaded from [Wikimedia Commons](https://commons.wikimedia.org/) and optimised
with svgo by `npm run data:flags` (`scripts/sync-flags.ts`). Do not edit them by hand: change
`scripts/flag-files.ts` (the file) or `src/data/flagRatios.ts` (the ratio, height:width) and run the script again.

Each flag is the file Wikipedia shows for the flag in de facto use (decision D13), in its real ratio (decision
D39). Optimising changes only how the drawing is written, not what it shows, so each file keeps its licence. The
files whose licence asks for a credit are also named on "Acerca de": Oman, Sint Eustatius and Saba.

| File | Entity | Ratio | Source | Licence |
|---|---|---|---|---|
| `ad.svg` | Andorra | 7:10 | [File:Flag of Andorra.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Andorra.svg) | Public domain |
| `ae.svg` | United Arab Emirates | 1:2 | [File:Flag of the United Arab Emirates.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_Arab_Emirates.svg) | Public domain |
| `af.svg` | Afghanistan | 1:2 | [File:Flag of the Taliban.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Taliban.svg) | Public domain |
| `ag.svg` | Antigua and Barbuda | 2:3 | [File:Flag of Antigua and Barbuda.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Antigua_and_Barbuda.svg) | Public domain |
| `ai.svg` | Anguilla | 1:2 | [File:Flag of Anguilla.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Anguilla.svg) | Public domain |
| `al.svg` | Albania | 5:7 | [File:Flag of Albania.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Albania.svg) | Public domain |
| `am.svg` | Armenia | 1:2 | [File:Flag of Armenia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Armenia.svg) | Public domain |
| `ao.svg` | Angola | 2:3 | [File:Flag of Angola.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Angola.svg) | Public domain |
| `ar.svg` | Argentina | 5:8 | [File:Flag of Argentina.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Argentina.svg) | Public domain |
| `as.svg` | American Samoa | 1:2 | [File:Flag of American Samoa.svg](https://commons.wikimedia.org/wiki/File:Flag_of_American_Samoa.svg) | Public domain |
| `at.svg` | Austria | 2:3 | [File:Flag of Austria.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Austria.svg) | Public domain |
| `au.svg` | Australia | 1:2 | [File:Flag of Australia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Australia.svg) | Public domain |
| `aw.svg` | Aruba | 2:3 | [File:Flag of Aruba.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Aruba.svg) | Public domain |
| `ax.svg` | Åland | 17:26 | [File:Flag of Åland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_%C3%85land.svg) | Public domain |
| `az.svg` | Azerbaijan | 1:2 | [File:Flag of Azerbaijan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Azerbaijan.svg) | Public domain |
| `ba.svg` | Bosnia and Herzegovina | 1:2 | [File:Flag of Bosnia and Herzegovina.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bosnia_and_Herzegovina.svg) | Public domain |
| `bb.svg` | Barbados | 2:3 | [File:Flag of Barbados.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Barbados.svg) | Public domain |
| `bd.svg` | Bangladesh | 3:5 | [File:Flag of Bangladesh.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bangladesh.svg) | Public domain |
| `be.svg` | Belgium | 13:15 | [File:Flag of Belgium.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Belgium.svg) | Public domain |
| `bf.svg` | Burkina Faso | 2:3 | [File:Flag of Burkina Faso.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Burkina_Faso.svg) | Public domain |
| `bg.svg` | Bulgaria | 3:5 | [File:Flag of Bulgaria.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bulgaria.svg) | Public domain |
| `bh.svg` | Bahrain | 3:5 | [File:Flag of Bahrain.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bahrain.svg) | Public domain |
| `bi.svg` | Burundi | 3:5 | [File:Flag of Burundi.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Burundi.svg) | Public domain |
| `bj.svg` | Benin | 2:3 | [File:Flag of Benin.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Benin.svg) | Public domain |
| `bm.svg` | Bermuda | 1:2 | [File:Flag of Bermuda.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bermuda.svg) | Public domain |
| `bn.svg` | Brunei | 1:2 | [File:Flag of Brunei.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Brunei.svg) | Public domain |
| `bo.svg` | Bolivia | 15:22 | [File:Flag of Bolivia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bolivia.svg) | Public domain |
| `bq-bo.svg` | Bonaire | 2:3 | [File:Flag of Bonaire.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bonaire.svg) | Public domain |
| `bq-sa.svg` | Saba | 2:3 | [File:Flag of Saba.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saba.svg), by Mysid | CC BY-SA 3.0 |
| `bq-se.svg` | Sint Eustatius | 2:3 | [File:Flag of Sint Eustatius.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Sint_Eustatius.svg), by Andrwsc | CC BY-SA 4.0 |
| `br.svg` | Brazil | 7:10 | [File:Flag of Brazil.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Brazil.svg) | Public domain |
| `bs.svg` | Bahamas | 1:2 | [File:Flag of the Bahamas.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Bahamas.svg) | Public domain |
| `bt.svg` | Bhutan | 2:3 | [File:Flag of Bhutan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bhutan.svg) | Public domain |
| `bw.svg` | Botswana | 2:3 | [File:Flag of Botswana.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Botswana.svg) | Public domain |
| `by.svg` | Belarus | 1:2 | [File:Flag of Belarus.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Belarus.svg) | Public domain |
| `bz.svg` | Belize | 3:5 | [File:Flag of Belize.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Belize.svg) | Public domain |
| `ca.svg` | Canada | 1:2 | [File:Flag of Canada.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Canada.svg) | Public domain |
| `cd.svg` | Democratic Republic of the Congo | 3:4 | [File:Flag of the Democratic Republic of the Congo.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Democratic_Republic_of_the_Congo.svg) | Public domain |
| `cf.svg` | Central African Republic | 2:3 | [File:Flag of the Central African Republic.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Central_African_Republic.svg) | Public domain |
| `cg.svg` | Republic of the Congo | 2:3 | [File:Flag of the Republic of the Congo.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Republic_of_the_Congo.svg) | Public domain |
| `ch.svg` | Switzerland | 1:1 | [File:Flag of Switzerland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Switzerland.svg) | Public domain |
| `ci.svg` | Ivory Coast | 2:3 | [File:Flag of Côte d'Ivoire.svg](https://commons.wikimedia.org/wiki/File:Flag_of_C%C3%B4te_d'Ivoire.svg) | Public domain |
| `ck.svg` | Cook Islands | 1:2 | [File:Flag of the Cook Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Cook_Islands.svg) | Public domain |
| `cl.svg` | Chile | 2:3 | [File:Flag of Chile.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Chile.svg) | Public domain |
| `cm.svg` | Cameroon | 2:3 | [File:Flag of Cameroon.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Cameroon.svg) | Public domain |
| `cn.svg` | China | 2:3 | [File:Flag of the People's Republic of China.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_People's_Republic_of_China.svg) | Public domain |
| `co.svg` | Colombia | 2:3 | [File:Flag of Colombia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Colombia.svg) | Public domain |
| `cr.svg` | Costa Rica | 3:5 | [File:Flag of Costa Rica.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Costa_Rica.svg) | Public domain |
| `cu.svg` | Cuba | 1:2 | [File:Flag of Cuba.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Cuba.svg) | Public domain |
| `cv.svg` | Cape Verde | 2:3 | [File:Flag of Cape Verde (3-2).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Cape_Verde_(3-2).svg) | Public domain |
| `cw.svg` | Curaçao | 2:3 | [File:Flag of Curaçao.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Cura%C3%A7ao.svg) | Public domain |
| `cy.svg` | Cyprus | 2:3 | [File:Flag of Cyprus.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Cyprus.svg) | Public domain |
| `cz.svg` | Czechia | 2:3 | [File:Flag of the Czech Republic.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Czech_Republic.svg) | Public domain |
| `de.svg` | Germany | 3:5 | [File:Flag of Germany.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Germany.svg) | Public domain |
| `dj.svg` | Djibouti | 2:3 | [File:Flag of Djibouti.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Djibouti.svg) | Public domain |
| `dk.svg` | Denmark | 28:37 | [File:Flag of Denmark.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Denmark.svg) | Public domain |
| `dm.svg` | Dominica | 1:2 | [File:Flag of Dominica.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Dominica.svg) | Public domain |
| `do.svg` | Dominican Republic | 2:3 | [File:Flag of the Dominican Republic.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Dominican_Republic.svg) | Public domain |
| `dz.svg` | Algeria | 2:3 | [File:Flag of Algeria.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Algeria.svg) | Public domain |
| `ec.svg` | Ecuador | 2:3 | [File:Flag of Ecuador.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Ecuador.svg) | Public domain |
| `ee.svg` | Estonia | 7:11 | [File:Flag of Estonia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Estonia.svg) | Public domain |
| `eg.svg` | Egypt | 2:3 | [File:Flag of Egypt.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Egypt.svg) | Public domain |
| `eh.svg` | Western Sahara | 1:2 | [File:Flag of the Sahrawi Arab Democratic Republic.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Sahrawi_Arab_Democratic_Republic.svg) | Public domain |
| `er.svg` | Eritrea | 1:2 | [File:Flag of Eritrea.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Eritrea.svg) | Public domain |
| `es.svg` | Spain | 2:3 | [File:Flag of Spain.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Spain.svg) | Public domain |
| `et.svg` | Ethiopia | 1:2 | [File:Flag of Ethiopia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Ethiopia.svg) | Public domain |
| `fi.svg` | Finland | 11:18 | [File:Flag of Finland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Finland.svg) | Public domain |
| `fj.svg` | Fiji | 1:2 | [File:Flag of Fiji.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Fiji.svg) | Public domain |
| `fk.svg` | Falkland Islands | 1:2 | [File:Flag of the Falkland Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Falkland_Islands.svg) | Public domain |
| `fm.svg` | Micronesia | 10:19 | [File:Flag of the Federated States of Micronesia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Federated_States_of_Micronesia.svg) | Public domain |
| `fo.svg` | Faroe Islands | 8:11 | [File:Flag of the Faroe Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Faroe_Islands.svg) | Public domain |
| `fr.svg` | France | 2:3 | [File:Flag of France.svg](https://commons.wikimedia.org/wiki/File:Flag_of_France.svg) | Public domain |
| `ga.svg` | Gabon | 3:4 | [File:Flag of Gabon.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Gabon.svg) | Public domain |
| `gb-eng.svg` | England | 3:5 | [File:Flag of England.svg](https://commons.wikimedia.org/wiki/File:Flag_of_England.svg) | Public domain |
| `gb-sct.svg` | Scotland | 3:5 | [File:Flag of Scotland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Scotland.svg) | Public domain |
| `gb-wls.svg` | Wales | 3:5 | [File:Flag of Wales.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Wales.svg) | Public domain |
| `gb.svg` | United Kingdom | 3:5 | [File:Flag of the United Kingdom (3-5).svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_Kingdom_(3-5).svg) | Public domain |
| `gd.svg` | Grenada | 3:5 | [File:Flag of Grenada.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Grenada.svg) | Public domain |
| `ge-ab.svg` | Abkhazia | 1:2 | [File:Flag of the Republic of Abkhazia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Republic_of_Abkhazia.svg) | Public domain |
| `ge.svg` | Georgia | 2:3 | [File:Flag of Georgia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Georgia.svg) | Public domain |
| `gg.svg` | Guernsey | 2:3 | [File:Flag of Guernsey.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Guernsey.svg) | CC0 |
| `gh.svg` | Ghana | 2:3 | [File:Flag of Ghana.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Ghana.svg) | Public domain |
| `gi.svg` | Gibraltar | 1:2 | [File:Flag of Gibraltar.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Gibraltar.svg) | Public domain |
| `gl.svg` | Greenland | 2:3 | [File:Flag of Greenland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Greenland.svg) | Public domain |
| `gm.svg` | Gambia | 2:3 | [File:Flag of The Gambia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_The_Gambia.svg) | Public domain |
| `gn.svg` | Guinea | 2:3 | [File:Flag of Guinea.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Guinea.svg) | Public domain |
| `gq.svg` | Equatorial Guinea | 2:3 | [File:Flag of Equatorial Guinea.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Equatorial_Guinea.svg) | Public domain |
| `gr.svg` | Greece | 2:3 | [File:Flag of Greece.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Greece.svg) | Public domain |
| `gt.svg` | Guatemala | 5:8 | [File:Flag of Guatemala.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Guatemala.svg) | Public domain |
| `gu.svg` | Guam | 22:41 | [File:Flag of Guam.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Guam.svg) | Public domain |
| `gw.svg` | Guinea-Bissau | 1:2 | [File:Flag of Guinea-Bissau.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Guinea-Bissau.svg) | Public domain |
| `gy.svg` | Guyana | 3:5 | [File:Flag of Guyana.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Guyana.svg) | Public domain |
| `hk.svg` | Hong Kong | 2:3 | [File:Flag of Hong Kong.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Hong_Kong.svg) | Public domain |
| `hn.svg` | Honduras | 1:2 | [File:Flag of Honduras (1949–2022, 2026–present).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Honduras_(1949%E2%80%932022,_2026%E2%80%93present).svg) | Public domain |
| `hr.svg` | Croatia | 1:2 | [File:Flag of Croatia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Croatia.svg) | Public domain |
| `ht.svg` | Haiti | 3:5 | [File:Flag of Haiti.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Haiti.svg) | Public domain |
| `hu.svg` | Hungary | 1:2 | [File:Flag of Hungary.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Hungary.svg) | Public domain |
| `id.svg` | Indonesia | 2:3 | [File:Flag of Indonesia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Indonesia.svg) | Public domain |
| `ie.svg` | Ireland | 1:2 | [File:Flag of Ireland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Ireland.svg) | Public domain |
| `il.svg` | Israel | 8:11 | [File:Flag of Israel.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Israel.svg) | Public domain |
| `im.svg` | Isle of Man | 1:2 | [File:Flag of the Isle of Man.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Isle_of_Man.svg) | CC0 |
| `in.svg` | India | 2:3 | [File:Flag of India.svg](https://commons.wikimedia.org/wiki/File:Flag_of_India.svg) | Public domain |
| `iq-kr.svg` | Kurdistan Region | 2:3 | [File:Flag of Kurdistan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kurdistan.svg) | Public domain |
| `iq.svg` | Iraq | 2:3 | [File:Flag of Iraq.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Iraq.svg) | Public domain |
| `ir.svg` | Iran | 4:7 | [File:Flag of Iran.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Iran.svg) | Public domain |
| `is.svg` | Iceland | 18:25 | [File:Flag of Iceland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Iceland.svg) | Public domain |
| `it.svg` | Italy | 2:3 | [File:Flag of Italy.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Italy.svg) | Public domain |
| `je.svg` | Jersey | 3:5 | [File:Flag of Jersey.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Jersey.svg) | Public domain |
| `jm.svg` | Jamaica | 1:2 | [File:Flag of Jamaica.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Jamaica.svg) | Public domain |
| `jo.svg` | Jordan | 1:2 | [File:Flag of Jordan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Jordan.svg) | Public domain |
| `jp.svg` | Japan | 2:3 | [File:Flag of Japan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Japan.svg) | Public domain |
| `ke.svg` | Kenya | 2:3 | [File:Flag of Kenya.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kenya.svg) | Public domain |
| `kg.svg` | Kyrgyzstan | 3:5 | [File:Flag of Kyrgyzstan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kyrgyzstan.svg) | Public domain |
| `kh.svg` | Cambodia | 16:25 | [File:Flag of Cambodia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Cambodia.svg) | Public domain |
| `ki.svg` | Kiribati | 1:2 | [File:Flag of Kiribati.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kiribati.svg) | Public domain |
| `km.svg` | Comoros | 3:5 | [File:Flag of the Comoros.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Comoros.svg) | Public domain |
| `kn.svg` | Saint Kitts and Nevis | 2:3 | [File:Flag of Saint Kitts and Nevis.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saint_Kitts_and_Nevis.svg) | Public domain |
| `kp.svg` | North Korea | 20:33 | [File:Flag of North Korea (Naenara Oct 2026).svg](https://commons.wikimedia.org/wiki/File:Flag_of_North_Korea_(Naenara_Oct_2026).svg) | Public domain |
| `kr.svg` | South Korea | 2:3 | [File:Flag of South Korea.svg](https://commons.wikimedia.org/wiki/File:Flag_of_South_Korea.svg) | Public domain |
| `kw.svg` | Kuwait | 1:2 | [File:Flag of Kuwait.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kuwait.svg) | Public domain |
| `ky.svg` | Cayman Islands | 1:2 | [File:Flag of the Cayman Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Cayman_Islands.svg) | Public domain |
| `kz.svg` | Kazakhstan | 1:2 | [File:Flag of Kazakhstan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kazakhstan.svg) | Public domain |
| `la.svg` | Laos | 2:3 | [File:Flag of Laos.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Laos.svg) | Public domain |
| `lb.svg` | Lebanon | 2:3 | [File:Flag of Lebanon.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Lebanon.svg) | Public domain |
| `lc.svg` | Saint Lucia | 1:2 | [File:Flag of Saint Lucia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saint_Lucia.svg) | Public domain |
| `li.svg` | Liechtenstein | 3:5 | [File:Flag of Liechtenstein.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Liechtenstein.svg) | Public domain |
| `lk.svg` | Sri Lanka | 1:2 | [File:Flag of Sri Lanka.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Sri_Lanka.svg) | Public domain |
| `lr.svg` | Liberia | 10:19 | [File:Flag of Liberia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Liberia.svg) | Public domain |
| `ls.svg` | Lesotho | 2:3 | [File:Flag of Lesotho.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Lesotho.svg) | Public domain |
| `lt.svg` | Lithuania | 3:5 | [File:Flag of Lithuania.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Lithuania.svg) | Public domain |
| `lu.svg` | Luxembourg | 3:5 | [File:Flag of Luxembourg.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Luxembourg.svg) | Public domain |
| `lv.svg` | Latvia | 1:2 | [File:Flag of Latvia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Latvia.svg) | Public domain |
| `ly.svg` | Libya | 1:2 | [File:Flag of Libya.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Libya.svg) | Public domain |
| `ma.svg` | Morocco | 2:3 | [File:Flag of Morocco.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Morocco.svg) | Public domain |
| `mc.svg` | Monaco | 4:5 | [File:Flag of Monaco.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Monaco.svg) | Public domain |
| `md-ga.svg` | Gagauzia | 1:2 | [File:Flag of Gagauzia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Gagauzia.svg) | Public domain |
| `md-sn.svg` | Transnistria | 1:2 | [File:Flag of Transnistria (state).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Transnistria_(state).svg) | Public domain |
| `md.svg` | Moldova | 1:2 | [File:Flag of Moldova.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Moldova.svg) | Public domain |
| `me.svg` | Montenegro | 1:2 | [File:Flag of Montenegro.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Montenegro.svg) | Public domain |
| `mg.svg` | Madagascar | 2:3 | [File:Flag of Madagascar.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Madagascar.svg) | Public domain |
| `mh.svg` | Marshall Islands | 10:19 | [File:Flag of the Marshall Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Marshall_Islands.svg) | Public domain |
| `mk.svg` | North Macedonia | 1:2 | [File:Flag of North Macedonia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_North_Macedonia.svg) | Public domain |
| `ml.svg` | Mali | 2:3 | [File:Flag of Mali.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mali.svg) | Public domain |
| `mm.svg` | Myanmar | 2:3 | [File:Flag of Myanmar.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Myanmar.svg) | Public domain |
| `mn.svg` | Mongolia | 1:2 | [File:Flag of Mongolia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mongolia.svg) | Public domain |
| `mo.svg` | Macau | 2:3 | [File:Flag of Macau.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Macau.svg) | Public domain |
| `mp.svg` | Northern Mariana Islands | 1:2 | [File:Flag of the Northern Mariana Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Northern_Mariana_Islands.svg) | Public domain |
| `mr.svg` | Mauritania | 2:3 | [File:Flag of Mauritania.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mauritania.svg) | Public domain |
| `ms.svg` | Montserrat | 1:2 | [File:Flag of Montserrat.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Montserrat.svg) | Public domain |
| `mt.svg` | Malta | 2:3 | [File:Flag of Malta.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Malta.svg) | Public domain |
| `mu.svg` | Mauritius | 2:3 | [File:Flag of Mauritius.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mauritius.svg) | Public domain |
| `mv.svg` | Maldives | 2:3 | [File:Flag of Maldives.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Maldives.svg) | Public domain |
| `mw.svg` | Malawi | 2:3 | [File:Flag of Malawi.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Malawi.svg) | Public domain |
| `mx.svg` | Mexico | 4:7 | [File:Flag of Mexico.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mexico.svg) | Public domain |
| `my.svg` | Malaysia | 1:2 | [File:Flag of Malaysia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Malaysia.svg) | Public domain |
| `mz.svg` | Mozambique | 2:3 | [File:Flag of Mozambique.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mozambique.svg) | Public domain |
| `na.svg` | Namibia | 2:3 | [File:Flag of Namibia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Namibia.svg) | Public domain |
| `nc.svg` | New Caledonia | 1:2 | [File:Flag of FLNKS.svg](https://commons.wikimedia.org/wiki/File:Flag_of_FLNKS.svg) | Public domain |
| `ne.svg` | Niger | 6:7 | [File:Flag of Niger.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Niger.svg) | Public domain |
| `nf.svg` | Norfolk Island | 1:2 | [File:Flag of Norfolk Island.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Norfolk_Island.svg) | CC0 |
| `ng.svg` | Nigeria | 1:2 | [File:Flag of Nigeria.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Nigeria.svg) | Public domain |
| `ni.svg` | Nicaragua | 3:5 | [File:Flag of Nicaragua.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Nicaragua.svg) | Public domain |
| `nl.svg` | Netherlands | 2:3 | [File:Flag of the Netherlands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Netherlands.svg) | Public domain |
| `no.svg` | Norway | 8:11 | [File:Flag of Norway.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Norway.svg) | Public domain |
| `np.svg` | Nepal | 1.22:1 | [File:Flag of Nepal.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Nepal.svg) | Public domain |
| `nr.svg` | Nauru | 1:2 | [File:Flag of Nauru.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Nauru.svg) | Public domain |
| `nu.svg` | Niue | 1:2 | [File:Flag of Niue.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Niue.svg) | Public domain |
| `nz.svg` | New Zealand | 1:2 | [File:Flag of New Zealand.svg](https://commons.wikimedia.org/wiki/File:Flag_of_New_Zealand.svg) | Public domain |
| `om.svg` | Oman | 4:7 | [File:Flag of Oman.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Oman.svg) | Open Government Licence – Oman 1.0 |
| `pa.svg` | Panama | 2:3 | [File:Flag of Panama.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Panama.svg) | Public domain |
| `pe.svg` | Peru | 2:3 | [File:Flag of Peru.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Peru.svg) | Public domain |
| `pf.svg` | French Polynesia | 2:3 | [File:Flag of French Polynesia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_French_Polynesia.svg) | CC0 |
| `pg-nsb.svg` | Bougainville | 2:3 | [File:Flag of Bougainville.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Bougainville.svg) | Public domain |
| `pg.svg` | Papua New Guinea | 3:4 | [File:Flag of Papua New Guinea.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Papua_New_Guinea.svg) | Public domain |
| `ph.svg` | Philippines | 1:2 | [File:Flag of the Philippines.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Philippines.svg) | Public domain |
| `pk.svg` | Pakistan | 2:3 | [File:Flag of Pakistan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Pakistan.svg) | Public domain |
| `pl.svg` | Poland | 5:8 | [File:Flag of Poland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Poland.svg) | Public domain |
| `pm.svg` | Saint Pierre and Miquelon | 2:3 | [File:Flag of Saint-Pierre and Miquelon.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saint-Pierre_and_Miquelon.svg) | Public domain |
| `pr.svg` | Puerto Rico | 2:3 | [File:Flag of Puerto Rico.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Puerto_Rico.svg) | Public domain |
| `ps.svg` | Palestine | 1:2 | [File:Flag of Palestine.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Palestine.svg) | Public domain |
| `pt.svg` | Portugal | 2:3 | [File:Flag of Portugal.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Portugal.svg) | Public domain |
| `pw.svg` | Palau | 5:8 | [File:Flag of Palau.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Palau.svg) | Public domain |
| `py.svg` | Paraguay | 11:20 | [File:Flag of Paraguay.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Paraguay.svg) | Public domain |
| `qa.svg` | Qatar | 11:28 | [File:Flag of Qatar.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Qatar.svg) | Public domain |
| `ro.svg` | Romania | 2:3 | [File:Flag of Romania.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Romania.svg) | Public domain |
| `rs.svg` | Serbia | 2:3 | [File:Flag of Serbia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Serbia.svg) | Public domain |
| `ru.svg` | Russia | 2:3 | [File:Flag of Russia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Russia.svg) | Public domain |
| `rw.svg` | Rwanda | 2:3 | [File:Flag of Rwanda.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Rwanda.svg) | Public domain |
| `sa.svg` | Saudi Arabia | 2:3 | [File:Flag of Saudi Arabia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saudi_Arabia.svg) | Public domain |
| `sb.svg` | Solomon Islands | 1:2 | [File:Flag of the Solomon Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Solomon_Islands.svg) | Public domain |
| `sc.svg` | Seychelles | 1:2 | [File:Flag of Seychelles.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Seychelles.svg) | Public domain |
| `sd.svg` | Sudan | 1:2 | [File:Flag of Sudan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Sudan.svg) | Public domain |
| `se.svg` | Sweden | 5:8 | [File:Flag of Sweden.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Sweden.svg) | Public domain |
| `sg.svg` | Singapore | 2:3 | [File:Flag of Singapore.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Singapore.svg) | Public domain |
| `sh-hl.svg` | Saint Helena | 1:2 | [File:Flag of Saint Helena.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saint_Helena.svg) | Public domain |
| `si.svg` | Slovenia | 1:2 | [File:Flag of Slovenia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Slovenia.svg) | Public domain |
| `sk.svg` | Slovakia | 2:3 | [File:Flag of Slovakia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Slovakia.svg) | Public domain |
| `sl.svg` | Sierra Leone | 2:3 | [File:Flag of Sierra Leone.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Sierra_Leone.svg) | Public domain |
| `sm.svg` | San Marino | 3:4 | [File:Flag of San Marino.svg](https://commons.wikimedia.org/wiki/File:Flag_of_San_Marino.svg) | Public domain |
| `sn.svg` | Senegal | 2:3 | [File:Flag of Senegal.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Senegal.svg) | Public domain |
| `so.svg` | Somalia | 2:3 | [File:Flag of Somalia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Somalia.svg) | Public domain |
| `sr.svg` | Suriname | 2:3 | [File:Flag of Suriname.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Suriname.svg) | Public domain |
| `ss.svg` | South Sudan | 1:2 | [File:Flag of South Sudan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_South_Sudan.svg) | Public domain |
| `st.svg` | São Tomé and Príncipe | 1:2 | [File:Flag of São Tomé and Príncipe.svg](https://commons.wikimedia.org/wiki/File:Flag_of_S%C3%A3o_Tom%C3%A9_and_Pr%C3%ADncipe.svg) | Public domain |
| `sv.svg` | El Salvador | 189:335 | [File:Flag of El Salvador.svg](https://commons.wikimedia.org/wiki/File:Flag_of_El_Salvador.svg) | Public domain |
| `sx.svg` | Sint Maarten | 2:3 | [File:Flag of Sint Maarten.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Sint_Maarten.svg) | Public domain |
| `sy.svg` | Syria | 2:3 | [File:Flag of Syria (2025-).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Syria_(2025-).svg) | Public domain |
| `sz.svg` | Eswatini | 2:3 | [File:Flag of Eswatini.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Eswatini.svg) | Public domain |
| `tc.svg` | Turks and Caicos Islands | 1:2 | [File:Flag of the Turks and Caicos Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Turks_and_Caicos_Islands.svg) | Public domain |
| `td.svg` | Chad | 2:3 | [File:Flag of Chad.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Chad.svg) | Public domain |
| `tg.svg` | Togo | 1:1.618 | [File:Flag of Togo.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Togo.svg) | Public domain |
| `th.svg` | Thailand | 2:3 | [File:Flag of Thailand.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Thailand.svg) | Public domain |
| `tj.svg` | Tajikistan | 1:2 | [File:Flag of Tajikistan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Tajikistan.svg) | Public domain |
| `tk.svg` | Tokelau | 1:2 | [File:Flag of Tokelau.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Tokelau.svg) | Public domain |
| `tl.svg` | East Timor | 1:2 | [File:Flag of East Timor.svg](https://commons.wikimedia.org/wiki/File:Flag_of_East_Timor.svg) | Public domain |
| `tm.svg` | Turkmenistan | 2:3 | [File:Flag of Turkmenistan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Turkmenistan.svg) | Public domain |
| `tn.svg` | Tunisia | 2:3 | [File:Flag of Tunisia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Tunisia.svg) | Public domain |
| `to.svg` | Tonga | 1:2 | [File:Flag of Tonga.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Tonga.svg) | Public domain |
| `tr.svg` | Turkey | 2:3 | [File:Flag of Turkey.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Turkey.svg) | Public domain |
| `tt.svg` | Trinidad and Tobago | 3:5 | [File:Flag of Trinidad and Tobago.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Trinidad_and_Tobago.svg) | Public domain |
| `tv.svg` | Tuvalu | 1:2 | [File:Flag of Tuvalu.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Tuvalu.svg) | Public domain |
| `tw.svg` | Taiwan | 2:3 | [File:Flag of the Republic of China.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Republic_of_China.svg) | Public domain |
| `tz.svg` | Tanzania | 2:3 | [File:Flag of Tanzania.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Tanzania.svg) | Public domain |
| `ua.svg` | Ukraine | 2:3 | [File:Flag of Ukraine.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Ukraine.svg) | Public domain |
| `ug.svg` | Uganda | 2:3 | [File:Flag of Uganda.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Uganda.svg) | Public domain |
| `us.svg` | United States | 10:19 | [File:Flag of the United States.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_States.svg) | Public domain |
| `uy.svg` | Uruguay | 2:3 | [File:Flag of Uruguay.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Uruguay.svg) | Public domain |
| `uz.svg` | Uzbekistan | 1:2 | [File:Flag of Uzbekistan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Uzbekistan.svg) | Public domain |
| `va.svg` | Vatican City | 1:1 | [File:Flag of Vatican City (2023–present).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Vatican_City_(2023%E2%80%93present).svg) | Public domain |
| `vc.svg` | Saint Vincent and the Grenadines | 2:3 | [File:Flag of Saint Vincent and the Grenadines.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Saint_Vincent_and_the_Grenadines.svg) | Public domain |
| `ve.svg` | Venezuela | 2:3 | [File:Flag of Venezuela.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Venezuela.svg) | Public domain |
| `vg.svg` | British Virgin Islands | 1:2 | [File:Flag of the British Virgin Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_British_Virgin_Islands.svg) | Public domain |
| `vi.svg` | United States Virgin Islands | 2:3 | [File:Flag of the United States Virgin Islands.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_States_Virgin_Islands.svg) | Public domain |
| `vn.svg` | Vietnam | 2:3 | [File:Flag of Vietnam.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Vietnam.svg) | Public domain |
| `vu.svg` | Vanuatu | 3:5 | [File:Flag of Vanuatu.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Vanuatu.svg) | Public domain |
| `ws.svg` | Samoa | 1:2 | [File:Flag of Samoa.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Samoa.svg) | Public domain |
| `xc.svg` | Northern Cyprus | 2:3 | [File:Flag of the Turkish Republic of Northern Cyprus.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_Turkish_Republic_of_Northern_Cyprus.svg) | Public domain |
| `xj.svg` | Jubaland | 2:3 | [File:Flag of Jubaland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Jubaland.svg) | Public domain |
| `xk.svg` | Kosovo | 5:7 | [File:Flag of Kosovo.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Kosovo.svg) | Public domain |
| `xo.svg` | South Ossetia | 1:2 | [File:Flag of South Ossetia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_South_Ossetia.svg) | Public domain |
| `xp.svg` | Puntland | 2:3 | [File:Flag of Puntland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Puntland.svg) | Public domain |
| `xs.svg` | Somaliland | 1:2 | [File:Flag of Somaliland.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Somaliland.svg) | Public domain |
| `xz.svg` | Zanzibar | 2:3 | [File:Flag of Zanzibar.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Zanzibar.svg) | Public domain |
| `ye.svg` | Yemen | 2:3 | [File:Flag of Yemen.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Yemen.svg) | Public domain |
| `za.svg` | South Africa | 2:3 | [File:Flag of South Africa.svg](https://commons.wikimedia.org/wiki/File:Flag_of_South_Africa.svg) | Public domain |
| `zm.svg` | Zambia | 2:3 | [File:Flag of Zambia.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Zambia.svg) | Public domain |
| `zw.svg` | Zimbabwe | 1:2 | [File:Flag of Zimbabwe.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Zimbabwe.svg) | Public domain |
