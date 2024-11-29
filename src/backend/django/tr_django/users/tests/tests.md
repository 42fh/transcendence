# Unit Test flow explanation

```graph LR
    A[Test Client] --> B[Django TestCase]
    B --> C[Django View]
    C --> D[Database]

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#fbb,stroke:#333,stroke-width:2px
```

The test bypasses several production components:

- ✗ Nginx (skipped)
- ✗ Daphne/ASGI (skipped)
- ✓ Django Views (tested)
- ✓ Database (tested)
- ✓ File System (tested)

When you use `self.client.patch()`, you're using Django's test client, which:

- Simulates HTTP requests directly to Django views
- Bypasses the web server (Nginx) and ASGI server (Daphne)
- Still performs:
  - URL routing
  - View processing
  - Database operations
  - File handling
  - Authentication/Authorization

Here's a simplified example of what happens in the test:

```python
# This line creates a fake image file in memory
image = Image.new('RGB', (100, 100), color='red')

# This simulates the multipart/form-data request that would normally come through Nginx
response = self.client.patch(
    self.url,
    data={'avatar': avatar_file},
    format='multipart'
)

# This verifies the view processed the request correctly
self.assertEqual(response.status_code, 200)
```
