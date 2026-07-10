from django.db import models

class PageView(models.Model):
    session_key = models.CharField(max_length=128)
    path = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.path} ({self.session_key})"
