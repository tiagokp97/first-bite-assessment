from rest_framework.decorators import api_view
from rest_framework.response import Response
from .tasks import scrape_recipe

@api_view(["POST"])
def scrape_and_import(request):
    url = request.data.get("url")
    scrape_recipe.delay(url)  
    return Response({"message": "Scraping iniciado"}, status=202)