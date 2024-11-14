import * as $rdf from 'rdflib';


// TODO - This is genai stuff need to work through this and fix to make it actually work

// Create a new store
const store = $rdf.graph();

// Define some namespaces
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const EX = $rdf.Namespace('http://example.org/');

// Add some triples to the store
store.add($rdf.sym(EX('alice')), FOAF('name'), $rdf.literal('Alice'));
store.add($rdf.sym(EX('alice')), FOAF('knows'), $rdf.sym(EX('bob')));
store.add($rdf.sym(EX('bob')), FOAF('name'), $rdf.literal('Bob'));
const test ="";
// Query the store
const query = $rdf.SPARQLToQuery(`
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT ?name
  WHERE {
    ?person foaf:name ?name .
  }
`, false, store);

store.query(query, (result) => {
  console.log(result['?name'].value);
});