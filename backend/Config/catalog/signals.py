from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Product
from django.conf import settings
import os

def get_meili_client():
    try:
        from meilisearch import Client
        return Client(
            getattr(settings, 'MEILI_HOST', 'http://127.0.0.1:7700'),
            getattr(settings, 'MEILI_MASTER_KEY', 'mve_master_key_123')
        )
    except Exception:
        return None

@receiver(post_save, sender=Product)
def sync_product_to_meilisearch(sender, instance, **kwargs):
    if os.environ.get('SKIP_MEILI_SYNC'):
        return
    client = get_meili_client()
    if not client:
        return
    try:
        primary_image = instance.images.filter(is_primary=True).first()
        index_name = "products"
        index = client.index(index_name)
        document = {
            'id': instance.id,
            'name': instance.name,
            'slug': instance.slug,
            'description': instance.description,
            'price': float(instance.price),
            'image_url': primary_image.url if primary_image else None,
            'category_id': instance.category_id,
            'is_active': instance.is_active,
        }
        index.add_documents([document])
    except Exception as e:
        print(f"Error syncing to Meilisearch: {e}")

@receiver(post_delete, sender=Product)
def remove_product_from_meilisearch(sender, instance, **kwargs):
    if os.environ.get('SKIP_MEILI_SYNC'):
        return
    client = get_meili_client()
    if not client:
        return
    try:
        index_name = "products"
        index = client.index(index_name)
        index.delete_document(instance.id)
    except Exception as e:
        print(f"Error deleting from Meilisearch: {e}")
