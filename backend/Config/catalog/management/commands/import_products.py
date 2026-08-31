import csv
import json
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from catalog.models import Category, CategoryAttributeSchema, Product, ProductImage

class Command(BaseCommand):
    help = "Imports products from a CSV file into the Mavine Households catalog with schema validation."

    def add_arguments(self, parser):
        parser.add_argument('--csv', type=str, required=True, help='Path to the products CSV file')

    def handle(self, *args, **options):
        csv_path = options['csv']
        self.stdout.write(self.style.NOTICE(f"Starting product import from: {csv_path}"))

        try:
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                headers = [h.strip().lower() for h in (reader.fieldnames or [])]
                self.stdout.write(f"Detected columns: {', '.join(headers)}")

                success_count = 0
                error_count = 0

                for row_idx, row in enumerate(reader, start=2):
                    name = row.get('name', '').strip()
                    cat_name = row.get('category', '').strip()
                    price_str = row.get('price', '0').strip()
                    stock_str = row.get('stock', '0').strip()
                    img_urls_str = row.get('image_urls', '').strip()
                    attr_str = row.get('attributes_json', '{}').strip()
                    heavy_str = row.get('is_heavy_item', 'false').strip().lower()
                    description = row.get('description', '').strip()

                    if not name:
                        self.stdout.write(self.style.WARNING(f"Row {row_idx}: Skipped due to missing product name."))
                        error_count += 1
                        continue

                    # Resolve or create category
                    category = None
                    if cat_name:
                        cat_slug = slugify(cat_name)
                        category, _ = Category.objects.get_or_create(
                            slug=cat_slug,
                            defaults={'name': cat_name}
                        )

                    # Parse attributes JSON
                    attributes = {}
                    if attr_str:
                        try:
                            attributes = json.loads(attr_str)
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(f"Row {row_idx} ({name}): Invalid JSON in attributes_json: {e}"))
                            error_count += 1
                            continue

                    # Validate against CategoryAttributeSchema if exists
                    if category and hasattr(category, 'attribute_schema'):
                        is_valid, errors = category.attribute_schema.validate_attributes(attributes)
                        if not is_valid:
                            self.stdout.write(self.style.ERROR(f"Row {row_idx} ({name}) validation failed: {'; '.join(errors)}"))
                            error_count += 1
                            continue

                    try:
                        price = Decimal(price_str.replace(',', ''))
                        stock = int(stock_str)
                        is_heavy = heavy_str in ['true', '1', 'yes', 't']
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f"Row {row_idx} ({name}): Number parsing error: {e}"))
                        error_count += 1
                        continue

                    slug = slugify(name)
                    product, created = Product.objects.update_or_create(
                        slug=slug,
                        defaults={
                            'name': name,
                            'category': category,
                            'description': description,
                            'price': price,
                            'stock_quantity': stock,
                            'is_heavy_item': is_heavy,
                            'attributes': attributes if isinstance(attributes, list) else attributes,
                            'is_active': True,
                        }
                    )

                    # Process images
                    if img_urls_str:
                        urls = [u.strip() for u in img_urls_str.split('|') if u.strip()]
                        for i, url in enumerate(urls):
                            ProductImage.objects.get_or_create(
                                product=product,
                                url=url,
                                defaults={'is_primary': (i == 0)}
                            )

                    action = "Created" if created else "Updated"
                    self.stdout.write(self.style.SUCCESS(f"Row {row_idx}: {action} product '{product.name}' (KES {product.price})"))
                    success_count += 1

                self.stdout.write(self.style.SUCCESS(f"\nImport finished! {success_count} succeeded, {error_count} failed."))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"CSV file not found at path: {csv_path}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Unexpected error during import: {e}"))
