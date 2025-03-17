
import requests
from bs4 import BeautifulSoup
import re


def scrape_recipe_data(url, timeout=10):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers, timeout=timeout)
    if response.status_code != 200:
        raise Exception(f"Erro ao acessar a página: HTTP {response.status_code}")

    soup = BeautifulSoup(response.text, "html.parser")

    title_element = soup.find("h1", class_="article-heading text-headline-400")
    title = title_element.text.strip() if title_element else "Título não encontrado"

    details_container = soup.find("div", class_="mm-recipes-details__content")
    recipe_details = {}
    if details_container:
        items = details_container.find_all("div", class_="mm-recipes-details__item")
        for item in items:
            label_tag = item.find("div", class_="mm-recipes-details__label")
            value_tag = item.find("div", class_="mm-recipes-details__value")

            if label_tag and value_tag:
                label = label_tag.get_text(strip=True).rstrip(":")
                value = value_tag.get_text(strip=True)
                recipe_details[label.lower().replace(" ", "_")] = value


    possible_classes = [
        "photo mntl-image universal-image__image lazyloadwait lazyloaded",
        "universal-image__image lazyloadwait lazyloaded",
        "primary-image__image mntl-primary-image--blurry loaded"
    ]

    image_url = "Not Found"
    all_images = []

    for class_name in possible_classes:
        found_images = soup.find_all("img", class_=class_name)
        all_images.extend(found_images)

    if all_images:
        first_img = all_images[0]
        if first_img.has_attr("data-src"):
            image_url = first_img["data-src"]
        elif first_img.has_attr("src"):
            image_url = first_img["src"]
    ingredients_list = []
    ul_element = soup.find("ul", class_="mm-recipes-structured-ingredients__list")

    
    if ul_element:
        li_elements = ul_element.find_all("li", class_="mm-recipes-structured-ingredients__list-item")
        for li in li_elements:
            p = li.find("p")
            if p:
                ingredient_text = p.get_text(separator=" ").strip()
                ingredients_list.append(ingredient_text)
    else:
        ingredients_list.append("Ingredientes não encontrados")


    steps = []
    ol_element = soup.find("ol", class_="comp mntl-sc-block mntl-sc-block-startgroup mntl-sc-block-group--OL")
    if ol_element:
        li_elements = ol_element.find_all("li", class_="comp mntl-sc-block mntl-sc-block-startgroup mntl-sc-block-group--LI")
        for index, li in enumerate(li_elements, start=1):
            step_text = li.find("p").get_text(strip=True) if li.find("p") else ""
            steps.append({"step_number": index, "instruction": step_text})

    return {
        "title": title,
        "image_url": image_url,       
        "ingredients": ingredients_list,
        "details": recipe_details,
        "steps": steps
    }



def recipes_are_equal(new_data, existing_recipe):

    same_title = new_data.get("title", "").strip() == existing_recipe.name.strip()
    existing_ingredients = set(existing_recipe.ingredients.values_list("name", flat=True))
    new_ingredients = set(new_data.get("ingredients", []))
    
    return same_title and (existing_ingredients == new_ingredients)

def create_or_fork_recipe(recipe_data):

    from .models import Recipe  
    
    possible_recipes = Recipe.objects.filter(name__iexact=recipe_data.get("title", "").strip())
    for recipe in possible_recipes:
        if recipes_are_equal(recipe_data, recipe):
          
            return recipe, False  
    
  
    if possible_recipes.exists():
        raise Exception("Uma receita com esse nome já existe, mas os dados diferem. Por favor, escolha um novo nome.")
    
 
    return None, True


