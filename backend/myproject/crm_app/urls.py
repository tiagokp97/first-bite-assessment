from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    IngredientViewSet,
    RestaurantViewSet,
    ScrapedPageViewSet,
    scrape_recipe_view,
    task_status_view,
    RecipeViewSet,
    get_task_status
)
from .auth_view import RegisterView, LoginView, UserProfileView

router = DefaultRouter()
router.register(r"ingredients", IngredientViewSet)
router.register(r"scraped", ScrapedPageViewSet)
router.register(r"recipes", RecipeViewSet,  basename='recipe')
router.register(r"restaurants", RestaurantViewSet ) 

urlpatterns = [
    path("api/", include(router.urls)), 
    path("scrape_recipe/", scrape_recipe_view, name="scrape_recipe"),
    path("api/tasks/<str:task_id>/", task_status_view, name="task_status"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path("task-status/<str:task_id>/", get_task_status, name="task_status"),
]

