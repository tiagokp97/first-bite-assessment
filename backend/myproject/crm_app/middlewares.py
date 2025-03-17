from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class RoleBasedAccessMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path.startswith("/api/admin/"):
            if not request.user.is_authenticated:
                return JsonResponse({"error": "Authentication required"}, status=401)
            
            if not hasattr(request.user, "role") or request.user.role != "admin":
                return JsonResponse({"error": "Admin access required"}, status=403)
