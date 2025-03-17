from django.urls import path, include

urlpatterns = [
    path("", include("myproject.crm_app.urls")),
]
