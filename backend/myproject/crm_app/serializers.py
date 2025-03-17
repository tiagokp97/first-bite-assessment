from rest_framework import serializers
from .models import Recipe, Ingredient, Restaurant, ScrapedPage
from django.contrib.auth.models import User, Group
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import Recipe, RecipeStep, Ingredient, Restaurant, RecipeIngredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["id", "name"]



class RecipeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeStep
        fields = ["step_number", "description"]

class RecipeBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ['id', 'name', 'image_url']

class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source="ingredient.name", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ["id", "ingredient_name"]

class RecipeSerializer(serializers.ModelSerializer):
    ingredients = serializers.ListField(child=serializers.CharField(), write_only=True)
    ingredient_objects = RecipeIngredientSerializer(many=True, read_only=True, source="recipe_ingredients")  # 🔹 Agora funciona!
    steps = RecipeStepSerializer(many=True, read_only=True)
    restaurants = serializers.PrimaryKeyRelatedField(many=True, queryset=Restaurant.objects.all())

    class Meta:
        model = Recipe
        fields = [
            "id", "name", "description", "ingredients", "ingredient_objects",
            "steps", "prep_time", "cook_time", "additional_time", "total_time",
            "servings", "restaurants"
        ]

    def create(self, validated_data):
        restaurants = validated_data.pop("restaurants", [])
        ingredient_names = validated_data.pop("ingredients", [])  
        recipe = Recipe.objects.create(**validated_data)  

        if restaurants:
            recipe.restaurants.set(restaurants)  

        if ingredient_names:
            ingredients = []
            for name in ingredient_names:
                ingredient, created = Ingredient.objects.get_or_create(name=name)  
                ingredients.append(ingredient)

            recipe.ingredients.set(ingredients)  

        return recipe



class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = "__all__"

class ScrapedPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapedPage
        fields = "__all__"

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "password"]

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)

class ProfileSerializer(serializers.ModelSerializer):
    restaurant = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "restaurant", "role"]

    def get_restaurant(self, obj):


        restaurant_group = obj.groups.filter(name__startswith="restaurant_").first()
        if restaurant_group:
            restaurant_id = restaurant_group.name.split("_")[1]  
            restaurant = Restaurant.objects.filter(id=restaurant_id).first()
            if restaurant:
                return {"id": restaurant.id,
                 "name": restaurant.name,
                "image_url": restaurant.image_url 
                }

        return None

    def get_role(self, obj):
        return "admin" if obj.groups.filter(name="Admin").exists() else "user"


class RegisterSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("id", "username", "password", "restaurant_name")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        restaurant_name = validated_data.pop("restaurant_name")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            **validated_data,
            password=password
        )

        restaurant, _ = Restaurant.objects.get_or_create(name=restaurant_name)

        restaurant.users.add(user)
        restaurant.save()  


        restaurant_group, _ = Group.objects.get_or_create(name=f"restaurant_{restaurant.id}")
        user.groups.add(restaurant_group)

        admin_group, _ = Group.objects.get_or_create(name="Admin")
        user.groups.add(admin_group)

        user.save()
        print(f"✅ Usuário {user.username} adicionado aos grupos: {[group.name for group in user.groups.all()]}")
        return user

