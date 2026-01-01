import httpx
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)

class OpenLibraryService:
    BASE_URL = "https://openlibrary.org"
    
    async def lookup_isbn(self, isbn: str) -> Optional[Dict]:
        """
        Lookup book metadata by ISBN from Open Library API
        """
        # Clean ISBN (remove hyphens, spaces)
        clean_isbn = isbn.replace("-", "").replace(" ", "")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try ISBN API first
                url = f"{self.BASE_URL}/isbn/{clean_isbn}.json"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    return await self._format_book_data(data, clean_isbn)
                
                # If not found, try search API
                search_url = f"{self.BASE_URL}/search.json"
                response = await client.get(search_url, params={"isbn": clean_isbn})
                
                if response.status_code == 200:
                    search_data = response.json()
                    if search_data.get("docs") and len(search_data["docs"]) > 0:
                        return await self._format_search_result(search_data["docs"][0], clean_isbn)
                
                return None
                
        except Exception as e:
            logger.error(f"Error looking up ISBN {isbn}: {e}")
            return None
    
    async def _format_book_data(self, data: Dict, isbn: str) -> Dict:
        """Format book data from ISBN API response"""
        # Get cover image
        cover_url = None
        if data.get("covers"):
            cover_id = data["covers"][0]
            cover_url = f"{self.BASE_URL}/covers/id/{cover_id}-L.jpg"
        
        # Get authors
        authors = []
        if data.get("authors"):
            for author_ref in data["authors"]:
                author_key = author_ref.get("key")
                if author_key:
                    try:
                        async with httpx.AsyncClient(timeout=5.0) as client:
                            author_response = await client.get(f"{self.BASE_URL}{author_key}.json")
                            if author_response.status_code == 200:
                                author_data = author_response.json()
                                authors.append(author_data.get("name", "Unknown"))
                    except:
                        pass
        
        return {
            "isbn": isbn,
            "title": data.get("title"),
            "authors": authors,
            "cover_url": cover_url,
            "publisher": data.get("publishers", [None])[0] if data.get("publishers") else None,
            "published_year": self._extract_year(data.get("publish_date")),
            "page_count": data.get("number_of_pages"),
            "description": self._extract_description(data)
        }
    
    async def _format_search_result(self, doc: Dict, isbn: str) -> Dict:
        """Format book data from search API response"""
        cover_url = None
        if doc.get("cover_i"):
            cover_url = f"{self.BASE_URL}/covers/id/{doc['cover_i']}-L.jpg"
        
        return {
            "isbn": isbn,
            "title": doc.get("title"),
            "authors": doc.get("author_name", []),
            "cover_url": cover_url,
            "publisher": doc.get("publisher", [None])[0] if doc.get("publisher") else None,
            "published_year": doc.get("first_publish_year"),
            "page_count": doc.get("number_of_pages_median"),
            "description": None
        }
    
    def _extract_year(self, date_str: Optional[str]) -> Optional[int]:
        """Extract year from various date formats"""
        if not date_str:
            return None
        try:
            # Try to extract 4-digit year
            import re
            match = re.search(r'\d{4}', str(date_str))
            if match:
                return int(match.group())
        except:
            pass
        return None
    
    def _extract_description(self, data: Dict) -> Optional[str]:
        """Extract description from various possible fields"""
        desc = data.get("description")
        if isinstance(desc, dict):
            return desc.get("value")
        elif isinstance(desc, str):
            return desc
        return None

# Singleton instance
openlibrary_service = OpenLibraryService()
