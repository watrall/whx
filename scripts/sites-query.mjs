export const UNESCO_SITES_QUERY = `
SELECT ?item ?itemLabel ?country ?description ?coordinate ?inscriptionYear ?image ?criteria ?unescoId ?officialUrl WHERE {
  {
    SELECT ?item
      (SAMPLE(?cName) AS ?countryName)
      (SAMPLE(?dEn) AS ?description)
      (SAMPLE(?coordVal) AS ?coordinate)
      (SAMPLE(?id) AS ?whsId)
      (SAMPLE(?url973) AS ?unescoURL_p973)
      (SAMPLE(?year) AS ?inscriptionYear)
      (SAMPLE(?img) AS ?image)
      (GROUP_CONCAT(DISTINCT ?critLabel; separator="|") AS ?criteria)
    WHERE {
      ?item wdt:P1435 wd:Q9259 .
      FILTER NOT EXISTS {
        ?item p:P1435 ?st .
        ?st ps:P1435 wd:Q9259 ; pq:P582 ?end .
      }
      OPTIONAL { ?item wdt:P17 ?c . OPTIONAL { ?c rdfs:label ?cName FILTER(LANG(?cName) = "en") } }
      OPTIONAL { ?item schema:description ?dEn FILTER(LANG(?dEn) = "en") }
      OPTIONAL { ?item wdt:P625 ?coordVal }
      ?item wdt:P757 ?id .
      OPTIONAL { ?item wdt:P973 ?url973 . FILTER(CONTAINS(STR(?url973), "whc.unesco.org/en/list/")) }
      OPTIONAL { ?item p:P1435 ?st . ?st ps:P1435 wd:Q9259 ; pq:P580 ?date . BIND(YEAR(?date) AS ?year) }
      OPTIONAL { ?item wdt:P18 ?img }
      OPTIONAL { ?item wdt:P2614 ?crit . ?crit rdfs:label ?critLabel . FILTER(LANG(?critLabel)="en") }
    }
    GROUP BY ?item
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en, [AUTO_LANGUAGE]". }
  BIND(?countryName AS ?country)
  BIND(IF(BOUND(?whsId), CONCAT("https://whc.unesco.org/en/list/", STR(?whsId)), IF(BOUND(?unescoURL_p973), STR(?unescoURL_p973), "")) AS ?officialUrl)
  BIND(IF(BOUND(?whsId), STR(?whsId), "") AS ?unescoId)
}
`;
