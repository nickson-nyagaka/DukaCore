from django.utils.deprecation import MiddlewareMixin
from .models import PageView
import uuid

class PageViewMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Only track GET requests to non-admin/api paths
        path = request.path
        if request.method != 'GET':
            return
        
        # We only want to track storefront views, so exclude /admin and /api
        if path.startswith('/admin') or path.startswith('/api'):
            return
            
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
            
        if not session_key:
            # Fallback if session still doesn't exist
            session_key = str(uuid.uuid4())
            
        PageView.objects.create(session_key=session_key, path=path)
