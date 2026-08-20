export async function searchCatchments(query) {

 if (!query || query.length < 3) {
 return [];
 }

 const response = await fetch(
 `/api/catchments/search?q=${encodeURIComponent(query)}`
 );

 if (!response.ok) {
 throw new Error(
 `Search failed with status ${response.status}`
 );
 }

 return response.json();
}