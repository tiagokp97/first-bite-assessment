from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from .models import Recipe, Ingredient, Restaurant, ScrapedPage, RecipeIngredient, RecipeStep
from .serializers import RecipeSerializer, IngredientSerializer, RestaurantSerializer, ScrapedPageSerializer, RecipeBriefSerializer
from .tasks import scrape_recipe_task
from django.http import JsonResponse
from celery.result import AsyncResult
from rest_framework.permissions import IsAuthenticated
from rest_framework.status import HTTP_200_OK
from rest_framework.decorators import action
from django.contrib.auth.models import Group
from rest_framework.response import Response

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

    @action(detail=False, methods=["GET"], url_path="my-ingredients", permission_classes=[IsAuthenticated])
    def my_ingredients(self, request, *args, **kwargs):
        user = request.user
        queryset = Ingredient.objects.filter(recipes__restaurants__users=user).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ScrapedPageViewSet(viewsets.ModelViewSet):
    queryset = ScrapedPage.objects.all()
    serializer_class = ScrapedPageSerializer


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["GET"], url_path="my-recipes", permission_classes=[IsAuthenticated])
    def my_restaurant_recipes(self, request, pk=None):
        restaurant = self.get_object()
        recipes = restaurant.recipes.all()
        serializer = RecipeBriefSerializer(recipes, many=True)
        return Response(serializer.data, status=200)

    @action(detail=True, methods=["POST"], permission_classes=[IsAuthenticated], url_path="add-recipe")
    def add_recipe_to_restaurant(self, request, pk=None):
            restaurant = self.get_object()  
            recipe_id = request.data.get("recipe_id")



            if not recipe_id:
                return Response(
                    {"error": "recipe_id is required"},
                    status=400
                )
            try:
                recipe = Recipe.objects.get(pk=recipe_id)
            except Recipe.DoesNotExist:
                return Response(
                    {"error": "Recipe not found"},
                    status=404
                )
            if restaurant not in request.user.restaurants.all():
                return Response(
                    {"error": "You do not have access to this restaurant."},
                    status=403
                )

            if restaurant.recipes.filter(id=recipe.id).exists():
                 return Response({"error": "This recipe is already added to the restaurant."}, status=400)

                 
            restaurant.recipes.add(recipe)
            for ri in recipe.recipe_ingredients.all():
                RecipeIngredient.objects.get_or_create(
                    recipe=recipe,
                    ingredient=ri.ingredient,
                    restaurant=restaurant
                )

            return JsonResponse(
                {"message": "Recipe added to restaurant successfully"},
                status=202
            )

    @action(detail=False, methods=["GET"], permission_classes=[IsAuthenticated], url_path="my-restaurants")
    def my_restaurants(self, request):
        user = request.user
        restaurants = user.restaurants.all()

        if not restaurants.exists():
            return Response({"error": "Usuário não possui nenhum restaurante."}, status=404)

        serializer = self.get_serializer(restaurants, many=True)
        return Response(serializer.data, status=200)

    @action(detail=True, methods=["POST"], permission_classes=[IsAuthenticated], url_path="upload-image")
    def upload_image(self, request, pk=None):
        restaurant = self.get_object()
        image_url = request.data.get("image_url") 

        if not image_url:
            return Response({"error": "Nenhuma URL de imagem enviada."}, status=400)

        restaurant.image_url = image_url  
        restaurant.save()

        return Response({"message": "Imagem atualizada com sucesso", "image_url": image_url}, status=200)

    @action(detail=False, methods=["POST"], permission_classes=[IsAuthenticated])
    def create_restaurant(self, request):
        user = request.user
        
        if not user.groups.filter(name="Admin").exists():
            return Response({"error": "Only admins can create restaurants."}, status=403)

        restaurant_name = request.data.get("name")
        if not restaurant_name:
            return Response({"error": "Restaurant name is required."}, status=400)

        restaurant, created = Restaurant.objects.get_or_create(name=restaurant_name)
        restaurant.users.add(user)
        restaurant.save()

        restaurant_group, _ = Group.objects.get_or_create(name=f"restaurant_{restaurant.id}")
        user.groups.add(restaurant_group)

        return Response(
            {
                "message": "Restaurant created successfully.",
                "restaurant": {
                    "id": str(restaurant.id),
                    "name": restaurant.name
                }
            },
            status=201
        )

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]


   

    @action(detail=False, methods=["GET"], permission_classes=[IsAuthenticated])
    def my_recipes_brief(self, request):
        user = request.user
        restaurants = user.restaurants.all()

        if not restaurants.exists():
            return Response(
                {"error": "Usuário não pertence a nenhum restaurante."},
                status=403
            )

        recipes = (
            Recipe.objects
                  .filter(restaurants__in=restaurants)
                  .distinct()
        )


        brief_serializer = RecipeBriefSerializer(recipes, many=True)
        return Response(brief_serializer.data, status=200)

    @action(detail=True, methods=["GET"], permission_classes=[IsAuthenticated])
    def my_recipe_detail(self, request, pk=None):
      
        user = request.user
        restaurants = user.restaurants.all()

        if not restaurants.exists():
            return Response(
                {"error": "Usuário não pertence a nenhum restaurante."},
                status=403
            )

        try:
            recipe = (
                Recipe.objects
                      .prefetch_related('restaurants', 'steps', 'recipe_ingredients__ingredient')
                      .get(pk=pk, restaurants__in=restaurants)
            )
        except Recipe.DoesNotExist:
            return Response(
                {"error": "Receita não encontrada ou não pertence ao seu usuário."},
                status=404
            )

        serializer = self.get_serializer(recipe)
        return Response(serializer.data, status=200)


    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        print("Payload recebido:", data)

        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print("Erro de validação:", serializer.errors)
            return JsonResponse({"errors": serializer.errors}, status=400)

        recipe = serializer.save()
        print("Receita criada com ID:", recipe.id)

        if "steps" in data:
            for step_data in data["steps"]:
                print("Criando passo:", step_data)  
                RecipeStep.objects.create(
                    recipe=recipe,
                    step_number=step_data["step_number"],
                    description=step_data["description"]
                )

        response_data = self.get_serializer(recipe).data
        print("Resposta enviada:", response_data)

        return JsonResponse(response_data, status=201)
    
    @action(detail=True, methods=["PATCH"], permission_classes=[IsAuthenticated], url_path="update")
    def update_recipe(self, request, pk=None):
        recipe = self.get_object()
        data = request.data

  
        for field, value in data.items():
            if field not in ["ingredients", "steps"]:
                setattr(recipe, field, value)

        recipe.save()

       
        if "ingredients" in data:
            recipe.recipe_ingredients.all().delete()  
            for ingredient_data in data["ingredients"]:
                ingredient_name = ingredient_data["name"]
                ingredient, _ = Ingredient.objects.get_or_create(name=ingredient_name)
                RecipeIngredient.objects.create(recipe=recipe, ingredient=ingredient, restaurant=recipe.restaurants.first())

        # Atualiza os passos
        if "steps" in data:
            recipe.steps.all().delete()  
            for step_data in data["steps"]:
                RecipeStep.objects.create(recipe=recipe, step_number=step_data["step_number"], description=step_data["description"])

        return JsonResponse(
            {"message": "Recipe updated successfully", "recipe": RecipeSerializer(recipe).data},
            status=200
        )
    

def get_task_status(request, task_id):
    result = AsyncResult(task_id)
    return JsonResponse({"task_id": task_id, "status": result.status, "result": result.result})

@api_view(["POST"])
@permission_classes([IsAuthenticated]) 
def scrape_recipe_view(request):
    url = request.data.get("url")
    restaurant_id = request.data.get("restaurant_id")  

    if not url or not restaurant_id:
        return JsonResponse({"error": "URL e restaurant_id são obrigatórios"}, status=400)

    task = scrape_recipe_task.delay(url, restaurant_id)

    return JsonResponse({"message": "Scraping enfileirado", "task_id": task.id})

@api_view(["GET"])
def task_status_view(request, task_id):
    result = AsyncResult(task_id)
    if result.state == "PENDING":
        data = {"state": result.state, "status": "Task pendente"}
    elif result.state != "FAILURE":
        data = {"state": result.state, "status": result.info}
    else:
        data = {"state": result.state, "status": str(result.info)}
    
    return JsonResponse(data, status=HTTP_200_OK)



